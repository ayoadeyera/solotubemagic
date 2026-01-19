
import streamlit as st
import streamlit.components.v1 as components
import os

# 1. Page Configuration
st.set_page_config(
    page_title="TubeMagic Hub",
    page_icon="🚀",
    layout="wide"
)

# 2. Key Handling via Streamlit Secrets
# Please add your key to the Streamlit Cloud Dashboard under 'Secrets'
# API_KEY = "your_key_here"
api_key = st.secrets.get("API_KEY", "")

def serve_app():
    try:
        if not os.path.exists("index.html"):
            st.error("Missing index.html. Ensure all files are uploaded to the root.")
            return

        with open("index.html", "r", encoding="utf-8") as f:
            html = f.read()

        # Injects the key into the browser environment
        injection = f"""
        <script>
            window.process = {{
                env: {{
                    API_KEY: "{api_key}"
                }}
            }};
        </script>
        """
        
        # We replace <head> with <head> + our injection
        html = html.replace("<head>", f"<head>{injection}")

        # Render the dashboard in a large iframe
        components.html(html, height=1200, scrolling=True)

        if not api_key:
            st.sidebar.error("⚠️ API Key missing. Add it to Streamlit Secrets.")

    except Exception as e:
        st.error(f"Error initializing app: {str(e)}")

if __name__ == "__main__":
    serve_app()
