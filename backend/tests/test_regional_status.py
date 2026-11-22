"""
Unit tests for CIVIC PULSE 360 Regional Status system.
Tests all 15 categories, location resolution, provider registry, caching, and error handling.
"""

import os
import tempfile
import unittest
from pathlib import Path
from unittest.mock import patch

temporary_directory = tempfile.TemporaryDirectory()
os.environ["CIVIC_DB_PATH"] = str(Path(temporary_directory.name) / "test_regional.sqlite3")

from backend.app import main, regional_services as rs


class RegionalStatusTests(unittest.TestCase):
    def setUp(self) -> None:
        main.DATABASE_PATH = Path(temporary_directory.name) / f"{self.id().split('.')[-1]}.sqlite3"
        main.DATABASE_PATH.parent.mkdir(parents=True, exist_ok=True)
        main.initialize_database()
        rs.refresh_all_caches()

    def test_location_resolution_defaults_to_bengaluru(self) -> None:
        # None or blank should default to Bengaluru coordinates
        default_loc = rs.resolve_location(None)
        self.assertEqual(default_loc["name"], "Bengaluru")
        self.assertAlmostEqual(default_loc["latitude"], 12.9716, places=3)
        self.assertAlmostEqual(default_loc["longitude"], 77.5946, places=3)

        blank_loc = rs.resolve_location("   ")
        self.assertEqual(blank_loc["name"], "Bengaluru")
        self.assertAlmostEqual(blank_loc["latitude"], 12.9716, places=3)

        # Karnataka should resolve to Bengaluru as state capital
        kar_loc = rs.resolve_location("Karnataka")
        self.assertEqual(kar_loc["name"], "Bengaluru")
        self.assertAlmostEqual(kar_loc["latitude"], 12.9716, places=3)

        # Explicit coordinates
        explicit_loc = rs.resolve_location("Custom Point", latitude=13.0, longitude=77.6)
        self.assertEqual(explicit_loc["name"], "Custom Point")
        self.assertAlmostEqual(explicit_loc["latitude"], 13.0, places=3)
        self.assertAlmostEqual(explicit_loc["longitude"], 77.6, places=3)

    def test_provider_registry_contains_all_15_categories(self) -> None:
        self.assertEqual(len(rs.PROVIDER_REGISTRY), 15)
        for cat_slug, info in rs.PROVIDER_REGISTRY.items():
            self.assertIn("provider_name", info)
            self.assertIn("provider_url", info)
            self.assertIn("category_supported", info)
            self.assertIn("api_endpoint", info)
            self.assertIn("auth_requirement", info)
            self.assertIn("data_type", info)
            self.assertIn("update_frequency", info)
            self.assertIn("health", info)

    def test_category_1_weather_and_rainfall(self) -> None:
        weather = rs.get_weather_status("Bengaluru, Karnataka")
        self.assertEqual(weather["category"], "weather")
        self.assertIn(weather["status"], ["live", "stale", "error"])
        self.assertEqual(weather["source"], "Open-Meteo")
        self.assertTrue(weather["source_url"].startswith("https://"))
        self.assertIsNotNone(weather["last_updated"])
        if weather["status"] == "live":
            self.assertIn("temperature", weather["data"])
            self.assertIn("humidity", weather["data"])
            self.assertIn("wind_speed_kmh", weather["data"])
            self.assertIn("rainfall_mm", weather["data"])
            self.assertIn("hourly_forecast", weather["data"])
            self.assertIn("daily_forecast", weather["data"])

    def test_category_2_accidents_and_closures(self) -> None:
        accidents = rs.get_accidents_status("Bengaluru, Karnataka")
        self.assertEqual(accidents["category"], "accidents")
        self.assertEqual(accidents["status"], "official_announcement")
        self.assertIn("Bengaluru Traffic Police", accidents["source"])
        self.assertIn("incidents", accidents["data"])
        self.assertTrue(len(accidents["data"]["incidents"]) > 0)
        first_incident = accidents["data"]["incidents"][0]
        self.assertIn("road", first_incident)
        self.assertIn("severity", first_incident)
        self.assertIn("authority", first_incident)

    def test_category_3_bus_service(self) -> None:
        bus = rs.get_bus_service_status("Bengaluru, Karnataka")
        self.assertEqual(bus["category"], "bus-service")
        self.assertEqual(bus["status"], "official_announcement")
        self.assertIn("BMTC", bus["source"])
        self.assertIn("major_routes", bus["data"])
        self.assertIn("pass_information", bus["data"])
        self.assertIn("live_gps_feed_status", bus["data"])
        # Verifies KIA airport routes and metro feeders
        routes = [r["route_no"] for r in bus["data"]["major_routes"]]
        self.assertTrue(any("KIA" in r for r in routes))

    def test_category_4_water_supply(self) -> None:
        water = rs.get_water_supply_status("Bengaluru, Karnataka")
        self.assertEqual(water["category"], "water-supply")
        self.assertEqual(water["status"], "official_announcement")
        self.assertIn("BWSSB", water["source"])
        self.assertIn("maintenance_schedules", water["data"])
        self.assertEqual(water["data"]["helpline"], "1916 (24x7 Toll Free)")

    def test_category_5_air_quality(self) -> None:
        aq = rs.get_air_quality_status("Bengaluru, Karnataka")
        self.assertEqual(aq["category"], "air-quality")
        self.assertIn(aq["status"], ["live", "stale", "error"])
        self.assertIn("Open-Meteo", aq["source"])
        if aq["status"] == "live":
            self.assertIn("us_aqi", aq["data"])
            self.assertIn("pollutants", aq["data"])
            self.assertIn("pm2_5", aq["data"]["pollutants"])
            self.assertIn("pm10", aq["data"]["pollutants"])
            self.assertIn("health_guidelines", aq["data"])

    def test_category_6_civic_complaints(self) -> None:
        with main.get_connection() as connection:
            # Seed a test complaint
            main.save_complaint(main.ComplaintCreate(
                category="Broken streetlight",
                description="Streetlight flickering on 5th Cross Road.",
                location="Koramangala 3rd Block, Bengaluru",
            ))
            status = rs.get_complaints_status(connection, "Bengaluru, Karnataka")
            self.assertEqual(status["category"], "complaints")
            self.assertEqual(status["status"], "live")
            self.assertGreaterEqual(status["data"]["total_complaints"], 1)
            self.assertGreaterEqual(status["data"]["pending_submitted"], 1)
            self.assertIn("recent_complaints", status["data"])

    def test_category_7_government_services(self) -> None:
        govt = rs.get_government_services_status("Bengaluru, Karnataka")
        self.assertEqual(govt["category"], "government-services")
        self.assertEqual(govt["status"], "official_announcement")
        self.assertIn("Seva Sindhu", govt["source"])
        self.assertIn("featured_schemes", govt["data"])
        scheme_names = [s["name"] for s in govt["data"]["featured_schemes"]]
        self.assertTrue(any("Gruha Jyothi" in n for n in scheme_names))
        self.assertTrue(any("SSP" in n for n in scheme_names))

    def test_category_8_emergency_alerts(self) -> None:
        alerts = rs.get_emergency_alerts_status("Bengaluru, Karnataka")
        self.assertEqual(alerts["category"], "emergency-alerts")
        self.assertEqual(alerts["status"], "official_announcement")
        self.assertIn("KSDMA", alerts["source"])
        self.assertIn("alerts", alerts["data"])
        self.assertIn("emergency_contacts", alerts["data"])
        self.assertEqual(alerts["data"]["emergency_contacts"]["disaster_management_toll_free"], "1070")

    def test_category_9_traffic_and_roads(self) -> None:
        traffic = rs.get_traffic_status("Bengaluru, Karnataka")
        self.assertEqual(traffic["category"], "traffic")
        self.assertEqual(traffic["status"], "official_announcement")
        self.assertIn("Bengaluru Traffic Police", traffic["source"])
        self.assertIn("corridor_conditions", traffic["data"])
        self.assertIn("authorization_status", traffic["data"])
        self.assertTrue(len(traffic["data"]["corridor_conditions"]) >= 3)

    def test_category_10_public_transport(self) -> None:
        transit = rs.get_public_transport_status("Bengaluru, Karnataka")
        self.assertEqual(transit["category"], "public-transport")
        self.assertEqual(transit["status"], "official_announcement")
        self.assertIn("BMRCL", transit["source"])
        self.assertIn("operational_lines", transit["data"])
        line_names = [l["line"] for l in transit["data"]["operational_lines"]]
        self.assertIn("Purple Line", line_names)
        self.assertIn("Green Line", line_names)

    def test_category_11_rail_service(self) -> None:
        rail = rs.get_rail_service_status("Bengaluru, Karnataka")
        self.assertEqual(rail["category"], "rail-service")
        self.assertEqual(rail["status"], "official_announcement")
        self.assertIn("South Western Railway", rail["source"])
        self.assertIn("major_stations", rail["data"])
        station_codes = [s["station_code"] for s in rail["data"]["major_stations"]]
        self.assertIn("SBC", station_codes)
        self.assertIn("SMVT", station_codes)

    def test_category_12_electricity(self) -> None:
        power = rs.get_electricity_status("Bengaluru, Karnataka")
        self.assertEqual(power["category"], "electricity")
        self.assertEqual(power["status"], "official_announcement")
        self.assertIn("BESCOM", power["source"])
        self.assertIn("maintenance_schedules", power["data"])
        self.assertEqual(power["data"]["helpline_number"], "1912 (24x7 Toll Free)")

    def test_category_13_parking(self) -> None:
        parking = rs.get_parking_status("Bengaluru, Karnataka")
        self.assertEqual(parking["category"], "parking")
        self.assertEqual(parking["status"], "directory")
        self.assertIn("BBMP", parking["source"])
        self.assertIn("facilities", parking["data"])
        self.assertTrue(len(parking["data"]["facilities"]) >= 3)
        self.assertIn("live_occupancy_note", parking["data"])

    def test_category_14_road_damage(self) -> None:
        with main.get_connection() as connection:
            # Seed a road damage complaint
            main.save_complaint(main.ComplaintCreate(
                category="Pothole / damaged road",
                description="Deep pothole in outer lane near metro station.",
                location="Indiranagar 100 Feet Road, Bengaluru",
            ))
            damage = rs.get_road_damage_status(connection, "Bengaluru, Karnataka")
            self.assertEqual(damage["category"], "road-damage")
            self.assertEqual(damage["status"], "live")
            self.assertGreaterEqual(damage["data"]["total_road_damage_reports"], 1)
            self.assertIn("known_hotspots", damage["data"])

    def test_category_15_tourist_attractions(self) -> None:
        tourist = rs.get_tourist_attractions_status("Bengaluru, Karnataka")
        self.assertEqual(tourist["category"], "tourist-attractions")
        self.assertEqual(tourist["status"], "directory")
        self.assertIn("Karnataka Tourism", tourist["source"])
        self.assertIn("attractions", tourist["data"])
        attraction_names = [a["name"] for a in tourist["data"]["attractions"]]
        self.assertTrue(any("Lalbagh" in n for n in attraction_names))
        self.assertTrue(any("Cubbon Park" in n for n in attraction_names))

    def test_all_15_categories_aggregated_endpoint(self) -> None:
        with main.get_connection() as connection:
            result = rs.get_all_regional_status(connection, "Bengaluru, Karnataka")
            self.assertEqual(result["categories_count"], 15)
            self.assertEqual(len(result["categories"]), 15)
            self.assertEqual(result["status"], "operational")
            self.assertIn("Bengaluru", result["location"])

            # Verify standard schema on all 15 categories
            categories_seen = set()
            for cat in result["categories"]:
                categories_seen.add(cat["category"])
                self.assertIn("category", cat)
                self.assertIn("category_name", cat)
                self.assertIn("location", cat)
                self.assertIn("status", cat)
                self.assertIn(cat["status"], ["live", "scheduled", "official_announcement", "directory", "unavailable", "error"])
                self.assertIn("source", cat)
                self.assertIn("source_url", cat)
                self.assertIn("last_updated", cat)
                self.assertIn("data", cat)
                self.assertIn("summary", cat)

            expected_slugs = {
                "weather", "accidents", "bus-service", "water-supply", "air-quality",
                "complaints", "government-services", "emergency-alerts", "traffic",
                "public-transport", "rail-service", "electricity", "parking",
                "road-damage", "tourist-attractions",
            }
            self.assertEqual(categories_seen, expected_slugs)

    def test_dedicated_fastapi_endpoints(self) -> None:
        # Test all dedicated endpoint functions in main.py
        all_res = main.api_regional_status()
        self.assertEqual(all_res["categories_count"], 15)

        prov = main.api_regional_providers()
        self.assertEqual(prov["count"], 15)

        ref = main.api_regional_refresh()
        self.assertTrue(ref["refreshed"])

        self.assertEqual(main.api_regional_weather()["category"], "weather")
        self.assertEqual(main.api_regional_accidents()["category"], "accidents")
        self.assertEqual(main.api_regional_bus_service()["category"], "bus-service")
        self.assertEqual(main.api_regional_water_supply()["category"], "water-supply")
        self.assertEqual(main.api_regional_air_quality()["category"], "air-quality")
        self.assertEqual(main.api_regional_complaints()["category"], "complaints")
        self.assertEqual(main.api_regional_government_services()["category"], "government-services")
        self.assertEqual(main.api_regional_emergency_alerts()["category"], "emergency-alerts")
        self.assertEqual(main.api_regional_traffic()["category"], "traffic")
        self.assertEqual(main.api_regional_public_transport()["category"], "public-transport")
        self.assertEqual(main.api_regional_rail_service()["category"], "rail-service")
        self.assertEqual(main.api_regional_electricity()["category"], "electricity")
        self.assertEqual(main.api_regional_parking()["category"], "parking")
        self.assertEqual(main.api_regional_road_damage()["category"], "road-damage")
        self.assertEqual(main.api_regional_tourist_attractions()["category"], "tourist-attractions")


if __name__ == "__main__":
    unittest.main()
