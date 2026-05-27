from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
import requests
import time

ONENOTE_URL = "https://vestfold.sharepoint.com/sites/TBG-Presterdungdomsskole/_layouts/15/Doc.aspx?sourcedoc={5c4abd58-9a1e-44a1-a551-251bd76e2ada}&action=edit&wd=target%28_Ukeplaner%2F8.%20trinn%2FPr%C3%B8veplan.one%7C4c0eb15f-2fe6-46f2-b8c6-43a9164c5c1f%2F8.trinn%20V%C3%85R%202026%7C7d927d65-7707-4350-bdf3-d9b76090e587%2F%29&wdorigin=NavigationUrl"
PI_URL = "http://100.76.42.81:8780/proveplan"
DRIVER_PATH = r"C:\Users\andre\OneDrive\aaacs\pus-portal\msedgedriver.exe"

service = Service(executable_path=DRIVER_PATH)
options = webdriver.EdgeOptions()
options.add_argument("--user-data-dir=C:\\Users\\andre\\AppData\\Local\\Microsoft\\Edge\\User Data")
options.add_argument("--profile-directory=Default")

driver = webdriver.Edge(service=service, options=options)

def vent_paa_innhold(min_lengde=200, timeout=60):
    print("Venter på innhold", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            driver.switch_to.default_content()
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            if iframes:
                driver.switch_to.frame(iframes[0])
            innhold = driver.find_element(By.CLASS_NAME, "OutlineContent")
            tekst = innhold.get_attribute("innerHTML").strip()
            if len(tekst) >= min_lengde:
                print(f" ok ({len(tekst)} tegn, {int(time.time()-start)}s)")
                return tekst
        except:
            pass
        print(".", end="", flush=True)
        time.sleep(3)
    print(" fallback til body")
    return driver.find_element(By.TAG_NAME, "body").get_attribute("innerHTML")

try:
    driver.get(ONENOTE_URL)
    tekst = vent_paa_innhold(min_lengde=200, timeout=60)
    tekst = tekst[:15000]
    print(f"Sender {len(tekst)} tegn til Pi...")

    resp = requests.post(PI_URL, json={"html": tekst})
    print(f"Pi status: {resp.status_code}")
    print(f"Pi svarte: {resp.text}")

finally:
    driver.quit()
