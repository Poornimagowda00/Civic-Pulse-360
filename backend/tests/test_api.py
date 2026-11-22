import json
import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

temporary_directory = tempfile.TemporaryDirectory()
os.environ["CIVIC_DB_PATH"] = str(Path(temporary_directory.name) / "test.sqlite3")

from backend.app import main


class CivicPulseApiTests(unittest.TestCase):
    def setUp(self) -> None:
        main.DATABASE_PATH = Path(temporary_directory.name) / f"{self.id().split('.')[-1]}.sqlite3"
        main.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        main.initialize_database()
        with main._regional_live_cache_lock:
            main._regional_live_cache.clear()

    def admin_session(self, role: str = "super_admin") -> str:
        bootstrap_email = "bootstrap@example.gov.in"
        bootstrap_password = "test-bootstrap-password-123"
        with patch.dict(os.environ, {
            "ADMIN_BOOTSTRAP_EMAIL": bootstrap_email,
            "ADMIN_BOOTSTRAP_PASSWORD": bootstrap_password,
            "ADMIN_BOOTSTRAP_NAME": "Test Super Admin",
        }):
            root = main.admin_login(main.AdminLoginRequest(email=bootstrap_email, password=bootstrap_password))
            if role == "super_admin":
                return root["session_token"]
            user_email = f"{role}@example.gov.in"
            password = "test-admin-user-password-123"
            main.create_admin_user(
                main.AdminCreateRequest(
                    full_name=f"Test {role}",
                    email=user_email,
                    password=password,
                    role=role,
                ),
                x_admin_session=root["session_token"],
            )
            return main.admin_login(main.AdminLoginRequest(email=user_email, password=password))["session_token"]

    def citizen_session(self, email: str) -> str:
        result = main.register(main.RegisterRequest(
            full_name="Test Citizen",
            email=email,
            mobile=f"9{len(email):09d}",
            password="secure-pass-123",
        ))
        return result["session_token"]

    def chat_request(self, host: str = "127.0.0.1") -> main.Request:
        return main.Request({"type": "http", "client": (host, 12345)})

    def test_complaint_can_be_created_and_status_tracked(self) -> None:
        complaint = main.save_complaint(
            main.ComplaintCreate.model_validate({
                "category": "Pothole / damaged road",
                "description": "Large pothole beside the bus stop.",
                "location": "12th Main, Indiranagar",
            })
        )
        self.assertTrue(complaint["id"].startswith("CP-"))
        self.assertEqual(complaint["status"], "Submitted")

        updated = main.update_complaint_status(
            complaint["id"],
            main.ComplaintStatusUpdate(status="In progress", note="Assigned for review."),
            x_admin_session=self.admin_session("support_admin"),
        )
        self.assertEqual(updated["status"], "In progress")

        history = main.complaint_updates(
            complaint["id"],
            x_complaint_owner_token=complaint["owner_token"],
        )
        self.assertEqual([item["status"] for item in history["updates"]], ["Submitted", "In progress"])
        notification = main.list_notifications()["notifications"][0]
        self.assertIn(complaint["id"], notification["title"])
        self.assertEqual(notification["category"], "Reports")

    def test_notification_read_state_is_private_to_authenticated_user(self) -> None:
        notification = main.create_notification(
            main.NotificationCreate(
                title="Public service update",
                detail="Check the official portal for current information.",
                category="Safety",
            ),
            x_admin_session=self.admin_session("content_admin"),
        )
        first_user = self.citizen_session("first-citizen@example.com")
        second_user = self.citizen_session("second-citizen@example.com")
        with main.get_connection() as connection:
            connection.execute(
                "UPDATE notifications SET is_read = 1 WHERE id = ?",
                (notification["id"],),
            )

        with self.assertRaises(main.HTTPException) as error:
            main.mark_notification_read(notification["id"])
        self.assertEqual(error.exception.status_code, 401)

        main.mark_notification_read(
            notification["id"],
            x_civic_session=first_user,
        )

        public_result = main.list_notifications()["notifications"][0]
        public_unread = main.list_notifications(unread_only=True)["notifications"]
        first_result = main.list_notifications(x_civic_session=first_user)["notifications"][0]
        second_result = main.list_notifications(x_civic_session=second_user)["notifications"][0]
        self.assertFalse(public_result["read"])
        self.assertEqual(len(public_unread), 1)
        self.assertTrue(first_result["read"])
        self.assertFalse(second_result["read"])

    def test_complaint_status_change_requires_configured_admin_token(self) -> None:
        complaint = main.save_complaint(
            main.ComplaintCreate(
                category="Pothole",
                description="Pothole near the main entrance.",
                location="Test Ward",
            )
        )
        with self.assertRaises(main.HTTPException) as error:
            main.update_complaint_status(
                complaint["id"],
                main.ComplaintStatusUpdate(status="Resolved"),
                x_admin_session="not-a-session",
            )
        self.assertEqual(error.exception.status_code, 401)

    def test_complaint_access_requires_owner_token_or_admin(self) -> None:
        complaint = main.save_complaint(
            main.ComplaintCreate(
                category="Pothole",
                description="Private pothole report description.",
                location="Private landmark and street",
            )
        )

        with self.assertRaises(main.HTTPException) as error:
            main.list_complaints()
        self.assertEqual(error.exception.status_code, 403)

        owned = main.list_complaints(
            x_complaint_owner_token=complaint["owner_token"],
        )
        self.assertEqual(len(owned["complaints"]), 1)
        self.assertEqual(owned["complaints"][0]["description"], "Private pothole report description.")

        administered = main.list_complaints(x_admin_session=self.admin_session())
        self.assertEqual(len(administered["complaints"]), 1)

    def test_complaint_updates_require_owner_or_admin(self) -> None:
        complaint = main.save_complaint(
            main.ComplaintCreate(
                category="Drainage",
                description="Private drainage report description.",
                location="Private ward location",
            )
        )

        with self.assertRaises(main.HTTPException) as error:
            main.complaint_updates(complaint["id"])
        self.assertEqual(error.exception.status_code, 403)

        owned = main.complaint_updates(
            complaint["id"],
            x_complaint_owner_token=complaint["owner_token"],
        )
        self.assertEqual(owned["updates"][0]["status"], "Submitted")

    def test_notification_creation_requires_admin_and_sanitizes_text(self) -> None:
        payload = main.NotificationCreate(
            title="  <b>Official</b> update  ",
            detail="Use <script>alert('fake')</script> the official portal.",
            category="Safety",
        )
        with self.assertRaises(main.HTTPException) as error:
            main.create_notification(payload)
        self.assertEqual(error.exception.status_code, 401)

        with self.assertRaises(main.HTTPException) as unauthorized:
            main.create_notification(payload, x_admin_session="not-a-session")
        self.assertEqual(unauthorized.exception.status_code, 401)
        created = main.create_notification(payload, x_admin_session=self.admin_session("content_admin"))

        self.assertEqual(created["title"], "Official update")
        self.assertNotIn("<", created["title"])
        self.assertNotIn("<script>", created["detail"])

    def test_invalid_complaint_is_rejected(self) -> None:
        with self.assertRaises(ValueError):
            main.ComplaintCreate.model_validate(
                {"category": "Road", "description": "bad", "location": "x"}
            )

    def test_chat_accepts_language_and_page_context(self) -> None:
        empty_context = main.chat(main.ChatRequest(
            message="How do I report a pothole?",
            language="English",
            current_page="bengaluru",
            context="",
        ), self.chat_request("127.0.0.11"))
        self.assertIn("Civic Eye", empty_context["answer"])

        result = main.chat(
            main.ChatRequest(
                message="How do I estimate my EMI?",
                language="Kannada",
                current_page="loan-connect",
                context="user: What is EMI?",
            ),
            self.chat_request("127.0.0.12"),
        )
        self.assertIn("illustration", result["answer"].lower())
        self.assertTrue(result["demo"])

    def test_registration_login_profile_and_logout(self) -> None:
        registered = main.register(main.RegisterRequest(
            full_name="Test Citizen",
            email="citizen@example.com",
            mobile="9876543210",
            password="secure-pass-123",
        ))
        token = registered["session_token"]
        me = main.current_user(x_civic_session=token)
        self.assertEqual(me["user"]["email"], "citizen@example.com")

        updated = main.update_profile(
            main.ProfileUpdate(
                full_name="Updated Citizen",
                location="Indiranagar",
                language="Kannada",
                occupation="Student",
            ),
            x_civic_session=token,
        )
        self.assertEqual(updated["user"]["location"], "Indiranagar")

        duplicate = main.RegisterRequest(
            full_name="Another Citizen",
            email="citizen@example.com",
            mobile="9876543211",
            password="another-pass-123",
        )
        with self.assertRaises(main.HTTPException) as error:
            main.register(duplicate)
        self.assertEqual(error.exception.status_code, 409)

        logged_in = main.login(main.LoginRequest(
            email="citizen@example.com",
            password="secure-pass-123",
        ))
        self.assertIn("session_token", logged_in)
        self.assertTrue(main.logout(x_civic_session=logged_in["session_token"])["logged_out"])

    def test_auth_route_schemas_match_request_models(self) -> None:
        specification = main.app.openapi()
        schemas = specification["components"]["schemas"]
        login_ref = specification["paths"]["/api/auth/login"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        register_ref = specification["paths"]["/api/auth/register"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        admin_ref = specification["paths"]["/api/admin/users"]["post"]["requestBody"]["content"]["application/json"]["schema"]["$ref"]
        self.assertTrue(login_ref.endswith("/LoginRequest"))
        self.assertTrue(register_ref.endswith("/RegisterRequest"))
        self.assertTrue(admin_ref.endswith("/AdminCreateRequest"))
        self.assertEqual(set(schemas["LoginRequest"]["properties"]), {"email", "password"})
        self.assertEqual(
            set(schemas["RegisterRequest"]["properties"]),
            {"full_name", "email", "mobile", "password"},
        )
        self.assertEqual(
            set(schemas["AdminCreateRequest"]["properties"]),
            {"full_name", "email", "password", "role"},
        )
        with self.assertRaises(ValueError):
            main.LoginRequest.model_validate({
                "full_name": "Should not be accepted",
                "email": "citizen@example.com",
                "mobile": "9876500222",
                "password": "secure-password",
            })

    def test_password_reset_requires_valid_single_use_token(self) -> None:
        complaint = main.register(main.RegisterRequest(
            full_name="Reset Citizen",
            email="reset@example.com",
            mobile="9876500010",
            password="old-password-123",
        ))
        forgot = main.forgot_password(main.ForgotPasswordRequest(email="reset@example.com"))
        self.assertIn("If the account exists", forgot["message"])
        with self.assertRaises(main.HTTPException) as error:
            main.reset_password(main.ResetPasswordRequest(token="x"*32, password="new-password-123"))
        self.assertEqual(error.exception.status_code, 400)

    def test_notification_preferences_require_session(self) -> None:
        with self.assertRaises(main.HTTPException) as error:
            main.get_notification_preferences()
        self.assertEqual(error.exception.status_code, 401)

    def test_sms_and_whatsapp_unconfigured_fail_explicitly(self) -> None:
        registered = main.register(main.RegisterRequest(
            full_name="Channel Citizen",
            email="channel@example.com",
            mobile="9876500011",
            password="channel-pass-123",
        ))
        token = registered["session_token"]
        payload = main.SmsWhatsappRequest(recipient="+919876500011", message="Test update")
        with self.assertRaises(main.HTTPException) as sms_error:
            main.send_sms(payload, x_civic_session=token)
        self.assertEqual(sms_error.exception.status_code, 503)
        with self.assertRaises(main.HTTPException) as whatsapp_error:
            main.send_whatsapp(payload, x_civic_session=token)
        self.assertEqual(whatsapp_error.exception.status_code, 503)

    def test_integration_status_reports_missing_credentials_without_secrets(self) -> None:
        with patch.dict(os.environ, {
            "GEMINI_API_KEY": "",
            "SMTP_HOST": "",
            "VAPID_PUBLIC_KEY": "",
            "TWILIO_ACCOUNT_SID": "",
            "WHATSAPP_PHONE_NUMBER_ID": "",
        }, clear=False):
            status = main.integration_status()
        self.assertFalse(status["gemini"]["configured"])
        self.assertFalse(status["smtp"]["configured"])
        self.assertFalse(status["browser_push"]["configured"])
        self.assertFalse(status["sms"]["configured"])
        self.assertFalse(status["whatsapp"]["configured"])
        self.assertNotIn("secret", str(status).lower())

    def test_chat_falls_back_when_gemini_unavailable(self) -> None:
        with patch.dict(os.environ, {"GEMINI_API_KEY": ""}, clear=False):
            result = main.chat(main.ChatRequest(
                message="How do I report a pothole?",
                language="English",
                current_page="civic-eye",
                context="",
            ), self.chat_request("127.0.0.13"))
        self.assertEqual(result["provider"], "local")
        self.assertTrue(result["demo"])
        self.assertIn("Civic Eye", result["answer"])

    def test_radar_refresh_records_checks_and_duplicate_ids(self) -> None:
        with patch.object(main.urllib.request, "urlopen", side_effect=main.urllib.error.URLError("offline")):
            result = main.refresh_opportunity_monitor()
        self.assertIn("changes", result)
        ids = [item["id"] for item in result["changes"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(item["status"] == "unavailable" for item in result["changes"]))

    def test_smtp_test_requires_admin_and_reports_missing_configuration(self) -> None:
        with patch.dict(os.environ, {"SMTP_HOST": "", "SMTP_FROM": "", "SMTP_USERNAME": ""}, clear=False):
            with self.assertRaises(main.HTTPException) as error:
                main.smtp_test(main.SmtpTestRequest(recipient="test@example.com"), x_admin_session="")
            self.assertEqual(error.exception.status_code, 401)
            with self.assertRaises(main.HTTPException) as unavailable:
                main.smtp_test(
                    main.SmtpTestRequest(recipient="test@example.com"),
                    x_admin_session=self.admin_session(),
                )
        self.assertEqual(unavailable.exception.status_code, 503)

    def test_radar_returns_deduplicated_official_starters(self) -> None:
        result = main.government_radar()
        ids = [item["id"] for item in result["opportunities"]]
        self.assertEqual(len(ids), len(set(ids)))
        self.assertTrue(all(item["official_url"].startswith("https://") for item in result["opportunities"]))

    def test_bmtc_live_status_never_returns_fake_vehicles(self) -> None:
        status = main.bmtc_live_status()
        self.assertFalse(status["live_tracking_available"])
        self.assertEqual(status["vehicles"], [])
        self.assertIn("No authorized BMTC", status["message"])

    def test_fact_check_does_not_claim_to_prove_truth(self) -> None:
        trusted = main.fact_check(
            main.FactCheckRequest(content="https://uidai.gov.in/ official update")
        )
        self.assertEqual(trusted["risk"], "Review details")
        self.assertIn("does not verify", trusted["explanation"])

        unknown = main.fact_check(
            main.FactCheckRequest(content="https://not-listed.example/scheme")
        )
        self.assertEqual(unknown["risk"], "Needs caution")
        self.assertIn("does not prove", unknown["explanation"])

        claim_only = main.fact_check(
            main.FactCheckRequest(content="A suspicious scholarship message with no URL.")
        )
        self.assertEqual(claim_only["risk"], "Needs review")
        self.assertIsNone(claim_only["hostname"])

    def test_regions_seed_all_states_and_admin_crud_is_authorized(self) -> None:
        roots = main.regional_regions()
        self.assertEqual(roots["count"], 36)
        karnataka = next(item for item in roots["regions"] if item["name"] == "Karnataka")
        with self.assertRaises(main.HTTPException) as unauthorized:
            main.regional_create_region(
                main.RegionCreate(name="Test District", region_type="district", parent_id=karnataka["id"])
            )
        self.assertEqual(unauthorized.exception.status_code, 401)

        admin = self.admin_session("government_data_admin")
        created = main.regional_create_region(
            main.RegionCreate(name="Test District", region_type="district", parent_id=karnataka["id"]),
            x_admin_session=admin,
        )["region"]
        updated = main.regional_update_region(
            created["id"],
            main.RegionCreate(name="Renamed District", region_type="district", parent_id=karnataka["id"]),
            x_admin_session=admin,
        )
        self.assertEqual(updated["region"]["name"], "Renamed District")
        city = main.regional_create_region(
            main.RegionCreate(name="Test City", region_type="city", parent_id=created["id"]),
            x_admin_session=admin,
        )["region"]
        state_filter = main.regional_regions(state="Karnataka")["regions"]
        self.assertIn(city["id"], {item["id"] for item in state_filter})
        self.assertIn(city["id"], {item["id"] for item in main.regional_regions(district="Renamed District")["regions"]})
        self.assertTrue(main.regional_delete_region(created["id"], x_admin_session=admin)["deleted"])
        audit = main.regional_audit(created["id"], x_admin_session=admin)
        self.assertEqual([entry["action"] for entry in audit["entries"]], ["deleted", "updated", "created"])

    def test_regional_status_is_source_labelled_deduplicated_and_not_feed_verified(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        status = main.RegionalStatusCreate(
            category="Weather and rainfall",
            status="live",
            summary="Operator reported rainfall update.",
            source_name="Test source",
            source_url="https://example.gov.in/status",
            observed_at=main.utc_now(),
        )
        admin = self.admin_session("government_data_admin")
        saved = main.regional_add_status(karnataka["id"], status, x_admin_session=admin)
        duplicate = main.regional_add_status(karnataka["id"], status, x_admin_session=admin)
        main.regional_add_status(
            karnataka["id"],
            main.RegionalStatusCreate(
                category="Water supply",
                status="live",
                summary="Outdated update.",
                source_name="Test source",
                source_url="https://example.gov.in/status",
                observed_at=(main.datetime.now(main.timezone.utc) - main.timedelta(days=2)).isoformat(),
            ),
            x_admin_session=admin,
        )
        self.assertEqual(saved["status"], "recorded")
        self.assertFalse(saved["verified_by_feed"])
        self.assertEqual(duplicate["status"], "unchanged")
        dashboard = main.regional_dashboard(karnataka["id"])
        weather = next(item for item in dashboard["categories"] if item["category"] == "Weather and rainfall")
        self.assertEqual(weather["status"], "live")
        self.assertFalse(weather["verified_by_feed"])
        self.assertTrue(weather["source_url"].startswith("https://"))
        detail = main.regional_category_detail(karnataka["id"], "Weather and rainfall")
        self.assertEqual(detail["records"][0]["data_origin"], "administrator_report")
        self.assertFalse(detail["records"][0]["verified_by_feed"])
        self.assertTrue(any(item["status"] == "unavailable" for item in dashboard["categories"]))
        water = next(item for item in dashboard["categories"] if item["category"] == "Water supply")
        self.assertEqual(water["status"], "unavailable")
        self.assertIn("over 24 hours old", water["note"])

    def test_regional_category_details_return_official_references_and_only_stored_records(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        categories = main.regional_dashboard(karnataka["id"])["categories"]
        self.assertEqual(len(categories), 15)
        self.assertEqual(set(main.REGIONAL_CATEGORY_ALTERNATIVES), set(main.REGIONAL_CATEGORIES))
        for item in categories:
            detail = main.regional_category_detail(karnataka["id"], item["category"])
            self.assertIsInstance(detail["alternative_guidance"], str)
            self.assertTrue(detail["alternative_guidance"], item["category"])
            self.assertEqual(detail["source_region_scope"], "Karnataka")
            self.assertTrue(all(source["url"].startswith("https://") for source in detail["official_sources"]))
            self.assertEqual(detail["records"], [])
            if item["category"] in {"Weather and rainfall", "Air quality"}:
                self.assertIn("not an official government feed", detail["official_feed_status"])
                self.assertEqual(detail["availability"], "model_provider")
            else:
                self.assertIn("No authorized", detail["official_feed_status"])
                self.assertFalse(any(source["data_feed"] for source in detail["official_sources"]))

        traffic = main.regional_category_detail(karnataka["id"], "Traffic and roads")
        self.assertTrue(any("btp.karnataka.gov.in" in source["url"] for source in traffic["official_sources"]))
        water = main.regional_category_detail(karnataka["id"], "Water supply")
        self.assertTrue(any("1916" in source["contact"] for source in water["official_sources"]))
        parking = main.regional_category_detail(karnataka["id"], "Parking")
        self.assertEqual(parking["availability"], "no_verified_provider")
        self.assertEqual(parking["official_sources"], [])

        tamil_nadu = next(item for item in main.regional_regions()["regions"] if item["name"] == "Tamil Nadu")
        city = main.regional_create_region(
            main.RegionCreate(name="Test City", region_type="city", parent_id=tamil_nadu["id"]),
            x_admin_session=self.admin_session("government_data_admin"),
        )["region"]
        outside_karnataka = main.regional_category_detail(city["id"], "Water supply")
        self.assertEqual(outside_karnataka["official_sources"], [])
        self.assertEqual(outside_karnataka["availability"], "no_region_specific_source")
        self.assertIn("Test City", outside_karnataka["alternative_guidance"])

        with self.assertRaises(main.HTTPException) as unknown_category:
            main.regional_category_detail(karnataka["id"], "unknown")
        self.assertEqual(unknown_category.exception.status_code, 404)
        with self.assertRaises(main.HTTPException) as missing_region:
            main.regional_category_detail("missing", "Weather and rainfall")
        self.assertEqual(missing_region.exception.status_code, 404)

    def test_regional_weather_and_air_quality_use_provider_values_and_timestamps(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        local_now = main.datetime.now(main.timezone(main.timedelta(hours=5, minutes=30))).strftime("%Y-%m-%dT%H:%M")

        class FakeResponse:
            def __init__(self, value: dict) -> None:
                self.value = value

            def __enter__(self):
                return self

            def __exit__(self, *_args):
                return False

            def read(self) -> bytes:
                return json.dumps(self.value).encode("utf-8")

        geocoding_response = FakeResponse({
            "results": [{
                "name": "Bengaluru",
                "country_code": "IN",
                "latitude": 12.9716,
                "longitude": 77.5946,
                "timezone": "Asia/Kolkata",
                "admin1": "Karnataka",
                "admin2": "Bengaluru Urban",
            }],
        })
        weather_response = FakeResponse({
            "utc_offset_seconds": 19800,
            "current_units": {
                "temperature_2m": "°C",
                "relative_humidity_2m": "%",
                "precipitation": "mm",
                "wind_speed_10m": "km/h",
            },
            "current": {
                "time": local_now,
                "temperature_2m": 26.2,
                "relative_humidity_2m": 60,
                "precipitation": 0.1,
                "weather_code": 61,
                "wind_speed_10m": 4.5,
            },
            "daily": {
                "time": [local_now[:10]],
                "temperature_2m_max": [29.0],
                "temperature_2m_min": [20.0],
                "precipitation_probability_max": [20],
            },
        })
        air_response = FakeResponse({
            "utc_offset_seconds": 19800,
            "current_units": {"pm2_5": "µg/m³", "pm10": "µg/m³"},
            "current": {
                "time": local_now,
                "us_aqi": 84,
                "pm2_5": 20.5,
                "pm10": 36.0,
            },
        })
        with patch.object(
            main.urllib.request,
            "urlopen",
            side_effect=[geocoding_response, weather_response, air_response],
        ) as urlopen_mock:
            result = main.regional_live_data(karnataka["id"], refresh=True)
            cached = main.regional_live_data(karnataka["id"])

        weather = result["categories"]["Weather and rainfall"]
        air_quality = result["categories"]["Air quality"]
        self.assertEqual(weather["status"], "live")
        self.assertIn("26.2 °C", weather["summary"])
        self.assertIn("rainfall now 0.1 mm", weather["summary"])
        self.assertEqual(air_quality["status"], "live")
        self.assertIn("US AQI 84", air_quality["summary"])
        self.assertTrue(weather["observed_at"].endswith("+00:00"))
        self.assertTrue(weather["verified_by_feed"])
        self.assertIn("not an official government feed", weather["note"])
        self.assertEqual(cached["cache"], "hit")
        self.assertEqual(urlopen_mock.call_count, 3)

    def test_regional_live_provider_failures_are_reported_without_claiming_verified_data(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        with patch.object(main.urllib.request, "urlopen", side_effect=ValueError("malformed provider response")):
            result = main.regional_live_data(karnataka["id"], refresh=True)

        self.assertEqual(result["categories"]["Weather and rainfall"]["status"], "unavailable")
        self.assertEqual(result["categories"]["Air quality"]["status"], "unavailable")
        self.assertFalse(result["categories"]["Weather and rainfall"]["verified_by_feed"])
        self.assertFalse(result["categories"]["Air quality"]["verified_by_feed"])
        self.assertTrue(result["errors"])

    def test_travel_directory_filters_and_account_history_stays_unconfirmed(self) -> None:
        listing = main.travel_destinations(q="Hampi", state="Karnataka")
        self.assertEqual([item["id"] for item in listing["destinations"]], ["hampi"])
        self.assertIn("not supplied", listing["availability"].lower())
        root_names = {item["name"] for item in main.regional_regions()["regions"]}
        catalog_states = {item["state"] for item in main.TRAVEL_DESTINATIONS}
        self.assertEqual(catalog_states, root_names)
        user = main.register(main.RegisterRequest(
            full_name="Travel Citizen",
            email="travel@example.com",
            mobile="9876543210",
            password="secure-pass-123",
        ))
        intent = main.travel_booking_intent(
            main.TravelIntentCreate(
                destination_id="hampi",
                destination_name="Hampi",
                provider_name="Karnataka Tourism",
                provider_url="https://karnatakatourism.org/",
                travel_date=(main.datetime.now(main.timezone.utc).date() + main.timedelta(days=1)).isoformat(),
                visitors=2,
            ),
            x_civic_session=user["session_token"],
        )
        self.assertEqual(intent["status"], "redirected_to_provider")
        self.assertFalse(intent["confirmed"])
        history = main.travel_booking_history(x_civic_session=user["session_token"])
        self.assertEqual(history["bookings"][0]["status"], "redirected_to_provider")
        self.assertIn("not confirmed", history["note"])

    def test_regional_subscriptions_receive_private_in_app_alerts(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        user = main.register(main.RegisterRequest(
            full_name="Regional Citizen",
            email="regional@example.com",
            mobile="9876543210",
            password="secure-pass-123",
        ))
        token = user["session_token"]
        subscribed = main.regional_subscribe(
            main.RegionalSubscription(region_id=karnataka["id"]),
            x_civic_session=token,
        )
        self.assertTrue(subscribed["subscribed"])
        self.assertEqual(len(main.regional_list_subscriptions(x_civic_session=token)["subscriptions"]), 1)

        main.regional_add_status(
            karnataka["id"],
            main.RegionalStatusCreate(
                category="Water supply",
                status="delayed",
                summary="Operator reported interruption.",
                source_name="Test source",
                source_url="https://example.gov.in/water",
                observed_at=main.utc_now(),
            ),
            x_admin_session=self.admin_session("government_data_admin"),
        )
        notifications = main.regional_notifications(x_civic_session=token)["notifications"]
        self.assertEqual(len(notifications), 1)
        self.assertEqual(notifications[0]["region_name"], "Karnataka")
        self.assertFalse(main.regional_unsubscribe(karnataka["id"], x_civic_session=token)["subscribed"])

    def test_admin_accounts_enforce_roles_and_rotate_expiring_sessions(self) -> None:
        super_session = self.admin_session()
        created = main.create_admin_user(
            main.AdminCreateRequest(
                full_name="Regional Data Operator",
                email="operator@example.gov.in",
                password="a-strong-admin-password-123",
                role="government_data_admin",
            ),
            x_admin_session=super_session,
        )
        self.assertTrue(created["is_active"])
        administrators = main.admin_users(x_admin_session=super_session)["administrators"]
        self.assertNotIn("password_hash", str(administrators))

        operator = main.admin_login(main.AdminLoginRequest(
            email="operator@example.gov.in",
            password="a-strong-admin-password-123",
        ))["session_token"]
        with self.assertRaises(main.HTTPException) as denied:
            main.create_notification(
                main.NotificationCreate(title="Test notice", detail="Test detail"),
                x_admin_session=operator,
            )
        self.assertEqual(denied.exception.status_code, 403)

        rotated = main.rotate_admin_session(x_admin_session=operator)["session_token"]
        with self.assertRaises(main.HTTPException) as expired:
            main.admin_session(x_admin_session=operator)
        self.assertEqual(expired.exception.status_code, 401)
        self.assertEqual(main.admin_session(x_admin_session=rotated)["admin"]["role"], "government_data_admin")
        self.assertTrue(main.admin_logout(x_admin_session=rotated)["logged_out"])
        with self.assertRaises(main.HTTPException):
            main.admin_session(x_admin_session=rotated)

        with main.get_connection() as connection:
            connection.execute(
                "UPDATE admin_sessions SET expires_at = ? WHERE token_hash = ?",
                ("2000-01-01T00:00:00+00:00", main.token_hash(super_session)),
            )
        with self.assertRaises(main.HTTPException) as expired_super:
            main.admin_session(x_admin_session=super_session)
        self.assertEqual(expired_super.exception.status_code, 401)

    def test_admin_bootstrap_and_last_super_admin_protection(self) -> None:
        with patch.dict(os.environ, {"ADMIN_BOOTSTRAP_EMAIL": "", "ADMIN_BOOTSTRAP_PASSWORD": ""}, clear=False):
            with self.assertRaises(main.HTTPException) as unavailable:
                main.admin_login(main.AdminLoginRequest(email="nobody@example.gov.in", password="no-password"))
        self.assertEqual(unavailable.exception.status_code, 401)

        session = self.admin_session()
        with self.assertRaises(main.HTTPException) as protected:
            main.update_admin_user(
                main.admin_session(x_admin_session=session)["admin"]["id"],
                main.AdminUserUpdate(role="support_admin", is_active=True),
                x_admin_session=session,
            )
        self.assertEqual(protected.exception.status_code, 409)

    def test_official_source_sync_persists_portal_reachability_only(self) -> None:
        with patch.object(main, "check_source_reachability") as checker:
            checker.side_effect = lambda source: {
                **source,
                "status": "available",
                "http_status": 200,
                "retries": 0,
                "error": "",
            }
            result = main.run_official_source_check()
        self.assertTrue(result["portal_reachability_only"])
        self.assertFalse(result["data_ingested"])
        self.assertEqual(len(result["sources"]), len(main.OFFICIAL_SOURCES))
        with main.get_connection() as connection:
            run = connection.execute(
                "SELECT result_count, available_count, unavailable_count FROM source_check_runs WHERE id = ?",
                (result["run_id"],),
            ).fetchone()
            checks = connection.execute(
                "SELECT COUNT(*) FROM source_check_results WHERE run_id = ?",
                (result["run_id"],),
            ).fetchone()[0]
        self.assertEqual(tuple(run), (len(main.OFFICIAL_SOURCES), len(main.OFFICIAL_SOURCES), 0))
        self.assertEqual(checks, len(main.OFFICIAL_SOURCES))
        history = main.source_check_history()
        self.assertEqual(history["latest_source_results"][0]["status"], "available")
        self.assertIn("no regional data", history["verification_scope"].lower())

    def test_source_connector_retries_transient_network_failure(self) -> None:
        class FakeResponse:
            status = 200

            def __enter__(self):
                return self

            def __exit__(self, _type, _value, _traceback):
                return False

        with patch.object(
            main.urllib.request,
            "urlopen",
            side_effect=[main.urllib.error.URLError("temporary"), FakeResponse()],
        ) as opener:
            result = main.check_source_reachability(main.OFFICIAL_SOURCES[0])
        self.assertEqual(result["status"], "available")
        self.assertEqual(result["retries"], 1)
        self.assertEqual(opener.call_count, 2)

    def test_regional_analytics_uses_only_recorded_history_and_exports_csv(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        admin = self.admin_session("government_data_admin")
        records = [
            ("live", "2026-01-02T10:00:00+00:00"),
            ("delayed", "2026-01-03T10:00:00+00:00"),
            ("unavailable", "2026-01-09T10:00:00+00:00"),
        ]
        for status, observed_at in records:
            main.regional_add_status(
                karnataka["id"],
                main.RegionalStatusCreate(
                    category="Weather and rainfall",
                    status=status,
                    summary=f"Stored {status} report.",
                    source_name="Test source",
                    source_url="https://example.gov.in/weather",
                    observed_at=observed_at,
                ),
                x_admin_session=admin,
            )
        report = main.regional_analytics(
            region_id=karnataka["id"],
            category="Weather and rainfall",
            from_date=main.date(2026, 1, 1),
            to_date=main.date(2026, 1, 31),
            bucket="weekly",
        )
        self.assertEqual(report["record_count"], 3)
        self.assertEqual(len(report["series"]), 2)
        self.assertEqual(sum(row["live"] for row in report["series"]), 1)
        self.assertEqual(sum(row["delayed"] for row in report["series"]), 1)
        self.assertEqual(sum(row["unavailable"] for row in report["series"]), 1)
        self.assertFalse("feed-verified" in report["sources"][0]["name"])
        csv_report = main.regional_analytics_csv(
            region_id=karnataka["id"],
            category="Weather and rainfall",
            from_date=main.date(2026, 1, 1),
            to_date=main.date(2026, 1, 31),
            bucket="weekly",
        )
        self.assertEqual(csv_report.media_type, "text/csv")
        self.assertEqual(len(csv_report.body.decode().splitlines()), 3)

    def test_chat_rate_limit_and_region_context_are_explicit(self) -> None:
        karnataka = next(item for item in main.regional_regions()["regions"] if item["name"] == "Karnataka")
        main.regional_add_status(
            karnataka["id"],
            main.RegionalStatusCreate(
                category="Water supply",
                status="delayed",
                summary="Operator reported interruption.",
                source_name="Water board notice",
                source_url="https://example.gov.in/water",
                observed_at=main.utc_now(),
            ),
            x_admin_session=self.admin_session("government_data_admin"),
        )
        with patch.dict(os.environ, {"GEMINI_API_KEY": "", "CHAT_RATE_LIMIT_PER_MINUTE": "1"}, clear=False):
            first = main.chat(
                main.ChatRequest(message="What is the water status in Karnataka?"),
                self.chat_request("127.0.0.88"),
            )
            self.assertIn("not verified live feeds", first["answer"])
            self.assertFalse(first["source_references"][0]["verified_by_feed"])
            with self.assertRaises(main.HTTPException) as limited:
                main.chat(
                    main.ChatRequest(message="What is the weather in Karnataka?"),
                    self.chat_request("127.0.0.88"),
                )
        self.assertEqual(limited.exception.status_code, 429)
        with main.get_connection() as connection:
            usage = connection.execute(
                "SELECT provider, outcome FROM gemini_usage ORDER BY id DESC LIMIT 1"
            ).fetchone()
        self.assertEqual(tuple(usage), ("local", "local_regional_fallback"))


if __name__ == "__main__":
    unittest.main()
