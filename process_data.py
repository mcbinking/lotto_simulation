import pandas as pd
import json
import glob
import os

def process_lotto_data():
    # Find the xlsx file
    files = glob.glob("db/*.xlsx")
    if not files:
        print("No Excel file found.")
        return

    file_path = files[0] # Use the first one found
    print(f"Processing {file_path}...")
    
    # Read Excel, assuming header is on row 0 or 1.
    # Based on previous output, row 0 is header.
    df = pd.read_excel(file_path)
    
    # Clean up column names or just select by index
    # We saw: Col 1 is Draw No, Col 2-7 are numbers, Col 8 is Bonus
    # Let's rename for clarity
    df = df.iloc[:, [1, 2, 3, 4, 5, 6, 7, 8]]
    df.columns = ['draw_no', 'num1', 'num2', 'num3', 'num4', 'num5', 'num6', 'bonus']
    
    # Drop rows with NaN in critical columns (if any)
    df = df.dropna(subset=['draw_no', 'num1'])
    
    # Sort by draw_no descending
    df['draw_no'] = df['draw_no'].astype(int)
    df = df.sort_values('draw_no', ascending=False)
    
    # 1. Last 10 Draws
    last_10 = df.head(10).to_dict(orient='records')
    
    # 2. Number Frequencies (All time)
    # Melt the number columns into one 'number' column
    numbers = df[['num1', 'num2', 'num3', 'num4', 'num5', 'num6']].melt(value_name='number')
    # Count frequencies
    counts = numbers['number'].value_counts().sort_index()
    
    # Prepare chart data labels (1-45) and values
    stats = {
        'labels': [str(i) for i in range(1, 46)],
        'data': [int(counts.get(i, 0)) for i in range(1, 46)]
    }
    
    output = {
        'last_10': last_10,
        'stats': stats,
        'last_updated': "2026-01-10" # Ideally dynamic, but static for now
    }
    
    with open('data.json', 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print("data.json created successfully.")

if __name__ == "__main__":
    process_lotto_data()
