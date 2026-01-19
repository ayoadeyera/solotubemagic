import streamlit as st
import streamlit.components.v1 as components
import os

# 1. Setup Page Appearance
st.set_page_config(
    page_title="TubeMagic Hub",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# 2. Securely retrieve the API Key from Streamlit Secrets
# This ensures process.env.API_KEY is available in your React code
api_key = st.secrets.get("API_KEY", "")

# 3. Load the Frontend
try:
    with open("index.html", "r", encoding="utf-8") as f:
        html_content = f.read()

    # Inject the API Key into the browser environment
    # This prevents the "process is not defined" error in the SDK
    injection = f"""
    <script>
      window.process = {{
        env: {{
          API_KEY: "{api_key}"
        }}
      }};
    </script>
    """
    
    # Place the injection at the very beginning of the head
    html_content = html_content.replace('<head>', f'<head>{injection}')

    # 4. Render the Application
    # We use a large height to ensure the dashboard is fully visible
    components.html(
        html_content,
        height=1200,
        scrolling=True
    )

except FileNotFoundError:
    st.error("Deployment Error: index.html not found. Please ensure all files are uploaded to the repository root.")
