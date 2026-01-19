
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
st.markdown("""
    <style>
        #MainMenu {visibility: hidden;}
        footer {visibility: hidden;}
        header {visibility: hidden;}
        .block-container {padding: 0px;}
        iframe {border: none;}
    </style>
""", unsafe_allow_value=True)

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
        tubemagic_component = components.declare_component("tubemagic_hub", path=".")
        
        # Render the component and pass the API key
        tubemagic_component(api_key=api_key)
        
    except Exception as e:
        st.error(f"Failed to load TubeMagic Engine: {str(e)}")

if __name__ == "__main__":
    main()
