import sqlite3
conn = sqlite3.connect('data/civic_pulse.db')
cursor = conn.cursor()
cursor.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name")
tables = [r[0] for r in cursor.fetchall()]
print('\n'.join(tables))
conn.close()
