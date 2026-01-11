import pandas as pd
import json
import glob
import os

def create_all_data():
    files = glob.glob("lotto_sim/db/*.xlsx")
    if not files:
        print("No Excel file found.")
        return

    file_path = files[0]
    print(f"Processing {file_path}...")
    
    # Read Excel. According to previous investigation, the data starts from a certain row.
    # We'll read it and clean it up.
    df = pd.read_excel(file_path)
    
    # Selecting the relevant columns: Draw No, Num1-6, Bonus
    # Looking at typical K-Lotto excel downloads:
    # Column 1: Draw No, Col 2-7: Numbers, Col 8: Bonus (starting from index 1 usually)
    # Let's try to identify columns by looking at the first few rows if possible, 
    # but based on lotto_sim/process_data.py, it used columns [1, 2, 3, 4, 5, 6, 7, 8].
    
    df = df.iloc[:, [1, 2, 3, 4, 5, 6, 7, 8]]
    df.columns = ['draw_no', 'num1', 'num2', 'num3', 'num4', 'num5', 'num6', 'bonus']
    
    df = df.dropna(subset=['draw_no', 'num1'])
    df['draw_no'] = df['draw_no'].astype(int)
    
    # Full history sorted by draw_no descending
    all_draws = df.sort_values('draw_no', ascending=False).to_dict(orient='records')
    
    # Calculate frequencies for all numbers 1-45 across all draws
    # Use only num1-num6 for standard frequency
    all_numbers = df[['num1', 'num2', 'num3', 'num4', 'num5', 'num6']].values.flatten()
    freq_map = {str(i): 0 for i in range(1, 46)}
    for n in all_numbers:
        if 1 <= n <= 45:
            freq_map[str(int(n))] += 1
            
    stats = {
        'labels': [str(i) for i in range(1, 46)],
        'data': [freq_map[str(i)] for i in range(1, 46)]
    }
    
    output = {
        'history': all_draws,
        'stats': stats,
        'last_updated': "2026-01-10"
    }
    
    with open('lotto_sim/data_all.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"data_all.json created with {len(all_draws)} draws.")

if __name__ == "__main__":
    create_all_data()
