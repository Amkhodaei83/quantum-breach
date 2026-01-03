import os

# --- CONFIGURATION ---
# The name of the output file
OUTPUT_FILE = "project_context.txt"

# Folders to ignore
IGNORE_DIRS = {
    'node_modules', 
    '.git', 
    'dist', 
    'build', 
    '.next', 
    'coverage',
    '__pycache__'
}

# File extensions to include (React/Web focus)
INCLUDE_EXTENSIONS = {
    '.js', 
    '.jsx', 
    '.ts', 
    '.tsx', 
    '.html', 
    '.json', 
    '.css', 
    '.scss'
}

# Specific files to ignore (optional)
IGNORE_FILES = {
    'package-lock.json',
    'yarn.lock',
    OUTPUT_FILE, # Don't include the output file itself
    os.path.basename(__file__) # Don't include this script
}

def get_tree_structure(startpath):
    """Generates a visual directory tree string."""
    tree_str = "PROJECT DIRECTORY STRUCTURE:\n"
    tree_str += "=" * 30 + "\n"
    
    for root, dirs, files in os.walk(startpath):
        # Modify dirs in-place to skip ignored directories
        dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]
        
        level = root.replace(startpath, '').count(os.sep)
        indent = ' ' * 4 * (level)
        tree_str += f"{indent}{os.path.basename(root)}/\n"
        subindent = ' ' * 4 * (level + 1)
        
        for f in files:
            # Only list relevant files in the tree to keep it clean (optional)
            # Remove the if check below if you want to see ALL files in the tree
            if os.path.splitext(f)[1] in INCLUDE_EXTENSIONS or f == 'package.json':
                tree_str += f"{subindent}{f}\n"
            
    tree_str += "=" * 30 + "\n\n"
    return tree_str

def main():
    root_dir = os.getcwd()
    
    with open(OUTPUT_FILE, 'w', encoding='utf-8') as outfile:
        
        # 1. Write the Directory Tree
        print("Generating directory tree...")
        tree = get_tree_structure(root_dir)
        outfile.write(tree)
        print("Tree generated.")

        # 2. Write File Contents
        print("Extracting file contents...")
        outfile.write("FILE CONTENTS:\n")
        outfile.write("=" * 30 + "\n")

        for root, dirs, files in os.walk(root_dir):
            # Skip ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS]

            for file in files:
                # Check for ignored files
                if file in IGNORE_FILES:
                    continue

                # Check extension
                _, ext = os.path.splitext(file)
                if ext in INCLUDE_EXTENSIONS:
                    file_path = os.path.join(root, file)
                    # Get relative path for cleaner headers (e.g., src/components/App.tsx)
                    rel_path = os.path.relpath(file_path, root_dir)

                    try:
                        with open(file_path, 'r', encoding='utf-8') as f:
                            content = f.read()
                            
                            # Write the file header
                            outfile.write(f"\n\n--- START OF FILE: {rel_path} ---\n")
                            outfile.write(content)
                            outfile.write(f"\n--- END OF FILE: {rel_path} ---\n")
                            
                            print(f"Processed: {rel_path}")
                    except Exception as e:
                        print(f"Could not read {rel_path}: {e}")

    print(f"\nDone! Project saved to '{OUTPUT_FILE}'")

if __name__ == "__main__":
    main()