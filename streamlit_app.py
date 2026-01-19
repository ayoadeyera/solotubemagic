import streamlit as st
import streamlit.components.v1 as components
import os

# Configure the Streamlit page
st.set_page_config(
    page_title="TubeMagic Hub",
    page_icon="🚀",
    layout="wide"
)

# Retrieve API Key from Streamlit Secrets
api_key = st.secrets.get("API_KEY", "")

def load_app():
    try:
        # Verify index.html exists in the same directory
        if not os.path.exists("index.html"):
            st.error("Error: index.html not found in the root directory.")
            return

        with open("index.html", "r", encoding="utf-8") as f:
            html_content = f.read()

        # Inject environment variables so the Gemini SDK can find the API Key
        injection = f"""
        <script>
            window.process = {{
                env: {{
                    API_KEY: "{api_key}"
                }}
            }};
        </script>
        """
        
        # Add injection right at the start of the head section
        html_content = html_content.replace("<head>", f"<head>{injection}")

        # Render the component
        # We use height 100vh approximate (1000px) for the dashboard
        components.html(html_content, height=1000, scrolling=True)

        if not api_key:
            st.sidebar.warning("⚠️ No API_KEY found in Streamlit Secrets.")
            st.sidebar.info("Add your key in 'Settings > Secrets' as: API_KEY = 'your_key'")

    except Exception as e:
        st.error(f"Failed to load application: {str(e)}")

if __name__ == "__main__":
    load_app()
