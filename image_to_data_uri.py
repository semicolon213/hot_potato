import base64
import os

def image_to_data_uri(image_path: str) -> str:
    """
    Converts an image file to a Data URI string.

    Args:
        image_path: The path to the image file.

    Returns:
        A string representing the Data URI of the image.
        Returns an empty string if the file does not exist or cannot be processed.
    """
    if not os.path.exists(image_path):
        print(f"Error: Image file not found at {image_path}")
        return ""

    try:
        # Determine the MIME type based on the file extension
        mime_types = {
            ".png": "image/png",
            ".jpg": "image/jpeg",
            ".jpeg": "image/jpeg",
            ".gif": "image/gif",
            ".svg": "image/svg+xml",
            ".webp": "image/webp",
        }
        file_extension = os.path.splitext(image_path)[1].lower()
        mime_type = mime_types.get(file_extension, "application/octet-stream")

        with open(image_path, "rb") as image_file:
            encoded_string = base64.b64encode(image_file.read()).decode("utf-8")

        return f"data:{mime_type};base64,{encoded_string}"
    except Exception as e:
        print(f"Error processing image file {image_path}: {e}")
        return ""

if __name__ == "__main__":
    # Example usage:
    # Replace 'path/to/your/image.png' with the actual path to your image file
    # For example, if you have an image named 'example.png' in the same directory:
    # image_file_path = "example.png"
    
    # For demonstration, let's assume a dummy image path.
    # You should replace this with a real image path for actual testing.
    dummy_image_path = "images/team/문준영.jpg" # Assuming this path exists from the folder structure provided earlier

    data_uri = image_to_data_uri(dummy_image_path)

    if data_uri:
        print("Data URI generated successfully. Here's a snippet:")
        print(data_uri[:100] + "...") # Print first 100 characters for brevity
        print("\nTo use this in HTML:")
        print(f'<img src="{data_uri}" alt="Embedded Image" />')
    else:
        print("Failed to generate Data URI.")
