
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
api_key = st.secrets.get("API_KEY", "")

def serve_app():
    try:
        # Instead of st.components.v1.html(string), we use declare_component(path=".")
        # This tells Streamlit to serve the current directory as a static file server.
        # This fixes the 404 errors for index.tsx and other module files.
        if not os.path.exists("index.html"):
            st.error("Missing index.html. Ensure all files are in the root directory.")
            return

        # Initialize the component. 
        # The 'path' argument is the key: it enables the browser to see all files in this folder.
        app_component = components.declare_component("tubemagic_hub", path=".")
        
        # We still need to pass the API_KEY. We'll do this as a parameter to the component.
        # The frontend will receive this via the 'args' prop or we can continue to inject 
        # it into the environment if needed, but declare_component works differently.
        # However, to keep it simple and consistent with your current setup, 
        # we provide the key as a component argument.
        app_component(api_key=api_key)

        if not api_key:
            st.sidebar.warning("⚠️ API Key missing in Secrets. Some features may not work.")

    except Exception as e:
        st.error(f"Error initializing app: {str(e)}")

if __name__ == "__main__":
    serve_app()
