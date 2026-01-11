import requests
import json
import os
from datetime import datetime

# 테스트 환경 파일 경로
DATA_FILE = 'lotto_sim/test/data.json'

def search_and_update_test():
    # 1. data.json 로드
    if not os.path.exists(DATA_FILE):
        print(f"Error: {DATA_FILE} not found.")
        return

    with open(DATA_FILE, 'r', encoding='utf-8') as f:
        data = json.load(f)

    # 2. 최신 회차 확인 (last_10의 첫 번째 요소)
    if not data['last_10']:
        print("Error: No history found in data.json.")
        return
    
    last_draw_no = data['last_10'][0]['draw_no']
    next_draw_no = last_draw_no + 1
    
    print(f"현재 최신 회차: {last_draw_no}. {next_draw_no} 회차 확인 중...")

    # 3. 동행복권 API 호출 (1206회차 시도)
    url = f"https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo={next_draw_no}"
    
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            res_json = response.json()
            
            if res_json.get("returnValue") == "success":
                print(f"새로운 회차 발견: #{next_draw_no}")
                
                # 새 데이터 객체 생성
                new_entry = {
                    "draw_no": res_json["drwNo"],
                    "num1": res_json["drwtNo1"],
                    "num2": res_json["drwtNo2"],
                    "num3": res_json["drwtNo3"],
                    "num4": res_json["drwtNo4"],
                    "num5": res_json["drwtNo5"],
                    "num6": res_json["drwtNo6"],
                    "bonus": res_json["bnusNo"]
                }
                
                # 4. 데이터 업데이트 (Incremental)
                # last_10 업데이트 (가장 앞에 추가)
                data['last_10'].insert(0, new_entry)
                # 10개 초과 시 오래된 것 삭제 (기존 로직 유지 시)
                if len(data['last_10']) > 10:
                    data['last_10'] = data['last_10'][:10]
                
                # stats 업데이트 (6개 번호 빈도수 +1)
                for i in range(1, 7):
                    num = res_json[f"drwtNo{i}"]
                    # stats.data 인덱스는 숫자 - 1
                    data['stats']['data'][num - 1] += 1
                
                data['last_updated'] = datetime.now().strftime("%Y-%m-%d")
                
                # 5. 파일 저장
                with open(DATA_FILE, 'w', encoding='utf-8') as f:
                    json.dump(data, f, ensure_ascii=False, indent=2)
                
                print(f"성공: {next_draw_no}회차 데이터가 data.json에 반영되었습니다.")
            else:
                print(f"알림: {next_draw_no}회차는 아직 추첨 전이거나 데이터가 없습니다.")
        else:
            print(f"에러: API 호출 실패 (HTTP {response.status_code})")
            
    except Exception as e:
        print(f"예외 발생: {e}")

if __name__ == "__main__":
    search_and_update_test()
