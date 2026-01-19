
import streamlit as st
import streamlit.components.v1 as components
import os

# Set page config for a professional look
st.set_page_config(
    page_title="TubeMagic Hub",
    page_icon="🚀",
    layout="wide",
    initial_sidebar_state="collapsed"
)

# Custom CSS to hide Streamlit UI elements for a cleaner "app" feel
# FIXED: unsafe_allow_html=True is the correct parameter
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .block-container {padding: 0px;}
        iframe {border: none;}
        /* Hide the Streamlit 'Manage app' button if possible */
        .stDeployButton {display:none;}
    </style>
""", unsafe_allow_html=True)

# 1. Retrieve API Key from Secrets
api_key = st.secrets.get("API_KEY", "")

def main():
    # 2. Check for index.html
    if not os.path.exists("index.html"):
        st.error("Setup Error: index.html not found in the root directory.")
        return

    # 3. Declare and render the component
    # Using path="." allows the component to access all project files relative to the root.
    try:
        # We use declare_component to serve the current directory as a web server
        tubemagic_component = components.declare_component("tubemagic_hub", path=".")
        
        # Render the component and pass the API key
        # This sends the "render" message that index.html is listening for
        tubemagic_component(api_key=api_key)
        
    except Exception as e:
        st.error(f"Failed to load TubeMagic Engine: {str(e)}")

if __name__ == "__main__":
    main()
