import http.server, socketserver
class H(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header('Cache-Control', 'no-store, no-cache, must-revalidate, max-age=0')
        self.send_header('Pragma', 'no-cache')
        self.send_header('Expires', '0')
        super().end_headers()
class S(socketserver.TCPServer):
    allow_reuse_address = True
PORT = 8090
with S(("", PORT), H) as httpd:
    print("no-cache dev server on http://localhost:%d/" % PORT)
    httpd.serve_forever()
