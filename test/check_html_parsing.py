import requests
import re

def check_lotto_html(draw_no):
    url = f"https://dhlottery.co.kr/gameResult.do?method=byWin&drwNo={draw_no}"
    print(f"Checking HTML for draw #{draw_no}...")
    
    try:
        res = requests.get(url, timeout=10)
        if res.status_code != 200:
            print("HTTP Error")
            return

        html = res.text
        
        # 1. 회차 정보 확인 (ex: "1206회")
        if f"{draw_no}회" not in html:
            print(">> 해당 회차 정보가 페이지에 없습니다. (아직 추첨 전일 가능성 높음)")
            # 최신 회차가 아니면 기본적으로 가장 최근 회차를 보여주므로, 
            # 요청한 회차 번호가 텍스트에 포함되어 있는지 확인해야 함.
            return

        # 2. 당첨 번호 추출 (HTML 구조 기반 정규식)
        # <span class="ball_645 lrg ball1">10</span> 패턴 찾기
        # 색상 클래스(ball1~5)는 다양하므로 ball_645 lrg 만 매칭
        pattern = r'<span class="ball_645 lrg ball[0-9]+">([0-9]+)</span>'
        numbers = re.findall(pattern, html)
        
        if len(numbers) >= 6:
            print(f">> 당첨 번호 발견! {numbers[:6]}")
            # 보너스 번호 찾기 (보너스 영역은 별도 구조일 수 있으나 위 패턴으로 보통 다 잡힘. 마지막이 보너스일 확률 높음)
            if len(numbers) >= 7:
                 print(f">> 보너스 번호 후보: {numbers[6]}")
        else:
            print(">> 번호를 찾을 수 없습니다. (HTML 구조 변경 또는 추첨 전)")
            
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    check_lotto_html(1206) # 미래 회차
    print("-" * 20)
    check_lotto_html(1205) # 과거 회차 (확인용)
