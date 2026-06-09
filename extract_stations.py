import pdfplumber
import pandas as pd
import requests
import sqlite3
import time
import os
import json

def fetch_coordinates(station_name):
    # Search: "<Station Name> Railway Station, India"
    query = f"{station_name} Railway Station, India"
    url = "https://nominatim.openstreetmap.org/search"
    params = {
        'q': query,
        'format': 'json',
        'limit': 1
    }
    headers = {
        'User-Agent': 'RailOneAI_Data_Intelligence_Engine/1.0'
    }
    try:
        response = requests.get(url, params=params, headers=headers)
        if response.status_code == 200:
            data = response.json()
            if data and len(data) > 0:
                return float(data[0]['lat']), float(data[0]['lon'])
    except Exception as e:
        print(f"Error fetching coordinates for {station_name}: {e}")
    return None, None

def extract_from_pdf(pdf_path):
    all_stations = []
    
    with pdfplumber.open(pdf_path) as pdf:
        for i, page in enumerate(pdf.pages):
            tables = page.extract_tables()
            for table in tables:
                for row in table:
                    # Clean row
                    cleaned_row = [str(cell).strip().replace('\n', '') if cell else '' for cell in row]
                    
                    if len(cleaned_row) >= 5:
                        s_no = cleaned_row[0]
                        
                        # Only process rows where first column is a number
                        if s_no.isdigit():
                            station_name = cleaned_row[1]
                            station_code = cleaned_row[2]
                            division = cleaned_row[3]
                            cat = cleaned_row[4]
                            remarks = cleaned_row[5] if len(cleaned_row) > 5 else ""
                            
                            all_stations.append({
                                'station_code': station_code,
                                'station_name': station_name,
                                'division': division,
                                'category': cat,
                                'remarks': remarks
                            })
                            
    return pd.DataFrame(all_stations)

def process_stations():
    base_dir = r"c:\Users\JoyMukherjee30\OneDrive\Desktop\railone-command-main"
    data_dir = os.path.join(base_dir, "Trains and station")
    pdf_file = "1624521405374-.4 Category_wise Stations ZZZ.pdf"
    pdf_path = os.path.join(data_dir, pdf_file)
    
    print("Extracting stations from PDF...")
    df = extract_from_pdf(pdf_path)
    
    # Remove duplicates
    df.drop_duplicates(subset=['station_code'], keep='first', inplace=True)
    
    print(f"Extracted {len(df)} stations. Enriching with coordinates...")
    
    # Load stations.json
    stations_json_path = os.path.join(data_dir, "stations.json")
    json_coords = {}
    try:
        with open(stations_json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
            for feature in data.get('features', []):
                props = feature.get('properties', {})
                geom = feature.get('geometry')
                code = props.get('code')
                if code and geom and geom.get('type') == 'Point':
                    coords = geom.get('coordinates')
                    if coords and len(coords) == 2:
                        json_coords[code] = (coords[1], coords[0]) # lat, lon
    except Exception as e:
        print(f"Failed to parse stations.json: {e}")
    
    lats = []
    lons = []
    
    # Optional: Cache mechanism to avoid requesting same coordinates multiple times during dev
    cache_file = os.path.join(data_dir, 'coord_cache.json')
    coord_cache = {}
    if os.path.exists(cache_file):
        with open(cache_file, 'r', encoding='utf-8') as f:
            coord_cache = json.load(f)
            
    for idx, row in df.iterrows():
        s_name = row['station_name']
        s_code = row['station_code']
        
        if s_code in json_coords:
            lat, lon = json_coords[s_code]
        elif s_name in coord_cache:
            lat, lon = coord_cache[s_name]
        else:
            lat, lon = fetch_coordinates(s_name)
            coord_cache[s_name] = (lat, lon)
            time.sleep(1)  # Respect Nominatim API limits (1 req/sec)
            
        lats.append(lat)
        lons.append(lon)
        
        if idx % 10 == 0:
            print(f"Processed {idx} stations...")
            # Save cache periodically
            with open(cache_file, 'w', encoding='utf-8') as f:
                json.dump(coord_cache, f)
                
    # Final cache save
    with open(cache_file, 'w') as f:
        json.dump(coord_cache, f)
        
    df['latitude'] = lats
    df['longitude'] = lons
    
    # 3. Generate stations.csv
    csv_out = os.path.join(base_dir, "stations.csv")
    df.to_csv(csv_out, index=False)
    print(f"Saved stations.csv to {csv_out}")
    
    # 2. Create normalized stations database (SQLite)
    db_out = os.path.join(base_dir, "stations.db")
    conn = sqlite3.connect(db_out)
    df.to_sql('stations', conn, if_exists='replace', index=False)
    conn.close()
    print(f"Saved normalized database to {db_out}")

if __name__ == '__main__':
    process_stations()
