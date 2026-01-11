import requests
import json

# 헤더 추가 (브라우저 위장)
headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Referer': 'https://www.dhlottery.co.kr/'
}

url = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=1206"

try:
    print("Requesting with headers...")
    res = requests.get(url, headers=headers, timeout=10)
    print(f"Status Code: {res.status_code}")
    
    # 응답 내용 확인
    try:
        data = res.json()
        print("✅ JSON 파싱 성공!")
        print(json.dumps(data, indent=2, ensure_ascii=False))
        
        if data.get('returnValue') == 'fail':
            print(">> 결과: 해당 회차 정보 없음 (아직 추첨 안 함)")
        else:
            print(">> 결과: 데이터 있음!")
            
    except json.JSONDecodeError:
        print("❌ JSON 파싱 실패 (여전히 HTML 반환됨)")
        print(res.text[:200])
        
except Exception as e:
    print(f"Error: {e}")
