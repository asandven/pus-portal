from selenium import webdriver
from selenium.webdriver.edge.service import Service
from selenium.webdriver.common.by import By
from selenium.webdriver.common.action_chains import ActionChains
import requests
import datetime
import time
import os

# Kjør bare fredag, lørdag eller søndag
dag = datetime.date.today().weekday()
if dag not in [4, 5, 6]:
    print(f"Ikke helgeperiode, avslutter.")
    exit()

# Hent neste uke
uke = datetime.date.today().isocalendar()[1] + 1
done_fil = f"C:\\Users\\andre\\AppData\\Local\\Temp\\ukeplan_uke{uke}_done.txt"
if os.path.exists(done_fil):
    print(f"Allerede kjørt uke {uke}, avslutter.")
    exit()

ONENOTE_URL = "https://vestfold.sharepoint.com/sites/TBG-Presterdungdomsskole/_layouts/15/Doc.aspx?sourcedoc={5c4abd58-9a1e-44a1-a551-251bd76e2ada}&action=edit&wd=target%28_Ukeplaner%2F8.%20trinn%2F8C.one%7Ca5f9f869-7459-4c40-80e0-65388211880b%2F%29"
PI_URL = "http://100.76.42.81:8780/ukeplan"
DRIVER_PATH = r"C:\Users\andre\OneDrive\aaacs\pus-portal\msedgedriver.exe"

service = Service(executable_path=DRIVER_PATH)
options = webdriver.EdgeOptions()
options.add_argument("--user-data-dir=C:\\Users\\andre\\AppData\\Local\\Microsoft\\Edge\\User Data")
options.add_argument("--profile-directory=Default")

driver = webdriver.Edge(service=service, options=options)
actions = ActionChains(driver)

def vent_paa_uke(uke_tekst, timeout=90):
    print(f"Venter på '{uke_tekst}'", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            driver.switch_to.default_content()
            iframes = driver.find_elements(By.TAG_NAME, "iframe")
            if iframes:
                driver.switch_to.frame(iframes[0])
            elems = driver.find_elements(By.XPATH, f"//*[normalize-space(text())='{uke_tekst}']")
            if elems:
                print(f" funnet ({int(time.time()-start)}s)")
                return elems[0]
        except:
            pass
        print(".", end="", flush=True)
        time.sleep(3)
    print(f" TIMEOUT!")
    return None

def vent_paa_innhold(min_lengde=200, timeout=40):
    print(f"Venter på innhold", end="", flush=True)
    start = time.time()
    while time.time() - start < timeout:
        try:
            innhold = driver.find_element(By.CLASS_NAME, "OutlineContent")
            tekst = innhold.text.strip()
            if len(tekst) >= min_lengde:
                print(f" ok ({len(tekst)} tegn, {int(time.time()-start)}s)")
                return tekst
        except:
            pass
        print(".", end="", flush=True)
        time.sleep(3)
    print(f" fallback til body")
    return driver.find_element(By.TAG_NAME, "body").text

try:
    driver.get(ONENOTE_URL)
    uke_tekst = f"Uke {uke}"
    print(f"Leter etter '{uke_tekst}' i navigasjonen...")

    uke_elem = vent_paa_uke(uke_tekst, timeout=90)
    if not uke_elem:
        print(f"Fant ikke '{uke_tekst}'. Avslutter.")
        driver.quit()
        exit()

    print(f"Klikker '{uke_tekst}'...")
    actions.move_to_element(uke_elem).click().perform()

    tekst = vent_paa_innhold(min_lengde=200, timeout=40)
    tekst = tekst[:10000]
    print(f"Sender {len(tekst)} tegn til Pi (uke {uke})...")

    # Send ukenummer eksplisitt — ikke la Claude gjette
    resp = requests.post(PI_URL, json={"html": tekst, "uke": uke})
    print(f"Pi status: {resp.status_code}")
    print(f"Pi svarte: {resp.text}")

    if resp.status_code == 200:
        open(done_fil, 'w').close()
        print(f"Markert som done for uke {uke}")

finally:
    driver.quit()