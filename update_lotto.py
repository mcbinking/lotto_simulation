import os
import json
import requests
import re
from datetime import datetime

# GitHub Secrets에서 API 키를 가져옵니다.
API_KEY = os.getenv("GEMINI_API_KEY")

def update_lotto_sequential():
    # 데이터 파일 경로 (루트 디렉토리 기준)
    DATA_FILE = 'data_all.json'
    
    if not API_KEY:
        print("Error: GEMINI_API_KEY 환경 변수가 설정되지 않았습니다.")
        return

    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found.")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    current_latest = data['history'][0]['draw_no']
    print(f"현재 데이터 최신 회차: {current_latest}")

    model_names = ["gemini-2.5-flash-lite", "gemini-2.5-flash", "gemini-3-flash"]
    
    prompt = f"""
    Search for all Korea Lotto 6/45 winning numbers from draw #{current_latest + 1} up to the latest available draw.
    Provide the results as a list of JSON objects.
    Format: 
    [
      {{"draw_no": 1203, "numbers": [1,2,3,4,5,6], "bonus": 7}},
      ...
    ]
    Include EVERY draw from #{current_latest + 1} up to the most recent one.
    Respond ONLY with the JSON array. NO explanations.
    """

    payload = {
        "contents": [{"parts": [{"text": prompt}]}],
        "tools": [{"google_search": {}}]
    }

    success = False
    for model in model_names:
        print(f"🚀 {model} 모델로 데이터 수급 시도 중...")
        url = f"https://generativelanguage.googleapis.com/v1beta/models/{model}:generateContent?key={API_KEY}"
        
        try:
            res = requests.post(url, json=payload, timeout=60)
            if res.status_code == 200:
                res_json = res.json()
                if 'candidates' in res_json:
                    ai_text = res_json['candidates'][0]['content']['parts'][0]['text']
                    
                    json_match = re.search(r'\[[\s\S]*\]', ai_text)
                    if json_match:
                        new_draws = json.loads(json_match.group())
                        new_draws.sort(key=lambda x: x['draw_no'])
                        
                        added_count = 0
                        for entry in new_draws:
                            draw_no = entry['draw_no']
                            if draw_no > current_latest:
                                print(f"📍 {draw_no}회차 반영 중...")
                                win_nums = entry['numbers']
                                bonus_num = entry['bonus']
                                
                                new_entry = {
                                    "draw_no": draw_no,
                                    "num1": win_nums[0], "num2": win_nums[1], "num3": win_nums[2],
                                    "num4": win_nums[3], "num5": win_nums[4], "num6": win_nums[5],
                                    "bonus": bonus_num
                                }
                                data['history'].insert(0, new_entry)
                                for n in win_nums:
                                    data['stats']['data'][n-1] += 1
                                added_count += 1
                                current_latest = draw_no
                        
                        if added_count > 0:
                            data['last_updated'] = datetime.now().strftime("%Y-%m-%d")
                            with open(DATA_FILE, 'w', encoding='utf-8') as f:
                                json.dump(data, f, ensure_ascii=False, indent=2)
                            print(f"🎉 총 {added_count}개 회차 업데이트 완료!")
                        else:
                            print("알림: 현재 데이터가 이미 최신입니다.")
                        
                        success = True
                        break
            else:
                print(f"❌ {model} 실패 (HTTP {res.status_code})")
                
        except Exception as e:
            print(f"❌ {model} 오류: {e}")

    if not success:
        print("❌ 모든 업데이트 시도가 실패했습니다.")

if __name__ == "__main__":
    update_lotto_sequential()
