import requests
import re

def check_lotto_html(draw_no):
    url = f"https://dhlottery.co.kr/gameResult.do?method=byWin&drwNo={draw_no}"
    print(f"Checking HTML for draw #{draw_no}...")
    
    try:
        res = requests.get(url, timeout=10)
        res.encoding = 'euc-kr' # 한글 깨짐 방지
        
        html = res.text
        
        # 1. 회차 정보 확인 (타이틀 태그 등에서 확인)
        # 예: <strong>1205회</strong>
        if f"{draw_no}회" in html:
            print(f"✅ {draw_no}회차 텍스트 발견!")
        else:
             # 최신 회차가 아니면 리다이렉트되거나 다른 번호가 뜸.
             # 정확한 확인을 위해 페이지 내의 <meta> 태그나 option 태그 확인이 필요할 수 있음.
             print(f"⚠️ {draw_no}회차 텍스트 미발견.")

        # 2. 당첨 번호 추출
        pattern = r'<span class="ball_645 lrg ball[0-9]+">([0-9]+)</span>'
        numbers = re.findall(pattern, html)
        
        if len(numbers) >= 6:
            print(f"   => 번호: {numbers[:6]} + 보너스 {numbers[6] if len(numbers)>6 else '?'}")
        else:
            print("   => 번호 추출 실패")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_lotto_html(1205) # 성공해야 함
    print("-" * 20)
    check_lotto_html(1206) # 실패해야 함 (또는 1205회 정보가 뜰 것임)
