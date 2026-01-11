import requests
import json

# 1206회차 조회
url = "https://www.dhlottery.co.kr/common.do?method=getLottoNumber&drwNo=1206"
try:
    res = requests.get(url, timeout=10)
    print(f"Status Code: {res.status_code}")
    print("Response Content Type:", res.headers.get('Content-Type'))
    
    # JSON 파싱 시도
    data = res.json()
    print(json.dumps(data, indent=2, ensure_ascii=False))
except Exception as e:
    print(f"Error: {e}")
    # 만약 JSON 디코딩 실패 시 텍스트 앞부분 출력
    print("Raw Text (First 100 chars):", res.text[:100])
