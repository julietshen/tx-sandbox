"""
Setup script for adding the PDQ Python module to the Python path.
"""

import os
import sys
from pathlib import Path

def setup_pdq_path():
    """
    Add the PDQ Python module to the Python path.
    This allows us to import the PDQ module from anywhere in our codebase.
    """
    # Base repository path
    repo_base = Path(os.path.dirname(os.path.abspath(__file__))).parent.parent.parent
    
    # Path to the PDQ Python module
    pdq_path = repo_base / "pdq" / "python"
    
    if pdq_path.exists():
        print(f"Adding PDQ Python module to path: {pdq_path}")
        sys.path.append(str(pdq_path))
        return True
    else:
        print(f"Error: PDQ Python module not found at {pdq_path}")
        return False

if __name__ == "__main__":
    # If this script is run directly, set up the PDQ path and validate it works
    success = setup_pdq_path()
    
    if success:
        try:
            # Try to import the PDQ hasher class to validate it works
            from pdqhashing.hasher.pdq_hasher import PDQHasher
            print("PDQ module successfully imported.")
            
            # Create an instance of the PDQ hasher
            hasher = PDQHasher()
            print("PDQ hasher instance created successfully.")
        except ImportError as e:
            print(f"Error importing PDQ module: {e}")
        except Exception as e:
            print(f"Error using PDQ module: {e}")
    else:
        print("PDQ setup failed. Make sure you have the PDQ module installed.") 