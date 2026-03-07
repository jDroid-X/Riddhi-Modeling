import os
import requests
import sys
import webbrowser
import http.server
import socketserver
import threading

# FaceOnWeb Engine - Web UI Version
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
WEB_PHOTO_DIR = os.path.join(BASE_DIR, "web_photo")
HTML_FILE = os.path.join(BASE_DIR, "FaceOnWeb.html")
PORT = 8080

class SimpleHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE_DIR, **kwargs)

def start_server():
    with socketserver.TCPServer(("", PORT), SimpleHandler) as httpd:
        print(f"FaceOnWeb Engine serving at http://localhost:{PORT}")
        httpd.serve_forever()

def main():
    print("--- FaceOnWeb Engine Intelligence Initializing ---")
    
    # 1. Ensure directories exist
    if not os.path.exists(WEB_PHOTO_DIR):
        os.makedirs(WEB_PHOTO_DIR)
        print(f"Created directory: {WEB_PHOTO_DIR}")

    # 2. Check for reference image
    ref_image = os.path.join(WEB_PHOTO_DIR, "Face.jpeg")
    if not os.path.exists(ref_image):
        print("\n[WARNING] 'Face.jpeg' not found in web_photo folder.")
        print("Please place the target photo in:")
        print(f"  {ref_image}")
        # Create a tiny dummy file for UI placeholder if needed, but user said they added it.

    # 3. Start local server in background
    server_thread = threading.Thread(target=start_server, daemon=True)
    server_thread.start()

    # 4. Open UI in Browser
    print(f"\nOpening FaceOnWeb UI...")
    webbrowser.open(f"http://localhost:{PORT}/FaceOnWeb.html")

    # 5. Keep main thread alive
    print("\nPress Ctrl+C to stop the engine.")
    try:
        while True:
            pass
    except KeyboardInterrupt:
        print("\nFaceOnWeb Engine stopped.")

if __name__ == "__main__":
    main()
