import os
from PIL import Image, ImageOps

source_path = "/home/raghav/.gemini/antigravity/brain/fcde5e08-f9d2-4ef7-b646-600f81a9a14e/clef_app_icon_1779658799184.png"
assets_images_dir = "/home/raghav/src/play-by-ear/assets/images"

def main():
    if not os.path.exists(source_path):
        print(f"Error: Source image not found at {source_path}")
        return

    # Open source image
    img = Image.open(source_path)
    print(f"Loaded source image: {img.size} {img.mode}")

    # Ensure format is RGBA
    if img.mode != 'RGBA':
        img = img.convert('RGBA')

    # Get dominant background color from the very corners (e.g., top-left corner 10,10)
    bg_color = img.getpixel((10, 10))
    hex_color = f"#{bg_color[0]:02X}{bg_color[1]:02X}{bg_color[2]:02X}"
    print(f"Corner background color: {bg_color} (Hex: {hex_color})")

    # 1. Main Icon (1024x1024)
    # The source is already 1024x1024. Let's save it directly as icon.png.
    main_icon_path = os.path.join(assets_images_dir, "icon.png")
    img_resized = img.resize((1024, 1024), Image.Resampling.LANCZOS)
    img_resized.save(main_icon_path, "PNG")
    print(f"Saved main icon to {main_icon_path}")

    # 2. Favicon (48x48)
    favicon_path = os.path.join(assets_images_dir, "favicon.png")
    favicon = img.resize((48, 48), Image.Resampling.LANCZOS)
    favicon.save(favicon_path, "PNG")
    print(f"Saved favicon to {favicon_path}")

    # 3. Android Adaptive Icon Background (solid color)
    # 512x512 with the same solid background color
    bg_img = Image.new("RGBA", (512, 512), bg_color)
    bg_path = os.path.join(assets_images_dir, "android-icon-background.png")
    bg_img.save(bg_path, "PNG")
    print(f"Saved Android adaptive background to {bg_path}")

    # 4. Android Adaptive Icon Foreground (Treble Clef + Glow with transparent background)
    # For a perfect adaptive icon, we can extract the center content (e.g. inside the rounded square) 
    # or we can crop/mask it. Since adaptive icons are masked dynamically by the OS, 
    # we should provide a transparent foreground. Let's make a version where we keep only the glowing clef, 
    # masking out the dark background.
    # To do this, we can compute transparency based on the pixel distance from the background color,
    # or just use a circle mask from the center.
    # Let's create a transparent image and copy the central 70% of the image, making the rest transparent.
    # Actually, the simplest high-quality approach is to keep the G-clef and its glow.
    # Let's extract pixels that are significantly brighter/different than the corner background color,
    # or let's create a beautiful G-clef icon with transparent background.
    # Alternatively, for adaptive icons, Expo allows the foreground image to have transparent areas.
    # Let's generate a foreground image by masking out the background corners.
    # Let's do a soft radial mask from the center.
    width, height = img.size
    fg_img = img.copy()
    fg_pixels = fg_img.load()
    
    # We want to make pixels outside the rounded square transparent.
    # Let's use a simple radial mask or distance-based alpha calculation to isolate the treble clef + glow.
    # Treble clef is white/blue, background is very dark (close to bg_color).
    # If a pixel's brightness is close to the background, we fade its alpha.
    for y in range(height):
        for x in range(width):
            r, g, b, a = fg_pixels[x, y]
            # Calculate distance from corner background color
            dist = ((r - bg_color[0])**2 + (g - bg_color[1])**2 + (b - bg_color[2])**2)**0.5
            
            # Radial distance from center (scaled 0 to 1)
            cx, cy = width / 2, height / 2
            rad_dist = ((x - cx)**2 + (y - cy)**2)**0.5 / (width / 2)
            
            if rad_dist > 0.75:
                # Completely transparent at the very edges/corners
                fg_pixels[x, y] = (r, g, b, 0)
            elif rad_dist > 0.5:
                # Soft transition at the rounded-square border
                factor = (0.75 - rad_dist) / 0.25
                new_alpha = int(a * factor)
                fg_pixels[x, y] = (r, g, b, new_alpha)

    fg_resized = fg_img.resize((1024, 1024), Image.Resampling.LANCZOS)
    fg_path = os.path.join(assets_images_dir, "android-icon-foreground.png")
    fg_resized.save(fg_path, "PNG")
    print(f"Saved Android adaptive foreground to {fg_path}")

    # 5. Splash Screen Icon (standard 1024x1024 or 512x512)
    # Splash icon is centered on the splash screen background. We can use the same foreground image or the full icon.
    # Let's save a 1024x1024 version as splash-icon.png.
    splash_path = os.path.join(assets_images_dir, "splash-icon.png")
    fg_resized.save(splash_path, "PNG")
    print(f"Saved splash icon to {splash_path}")

    # 6. Android Monochrome Image (simple black/white alpha mask of the clef)
    mono_img = Image.new("L", (512, 512), 0)
    # Let's downsample and make a simple monochrome image by thresholding the foreground alpha/brightness
    fg_small = fg_resized.resize((512, 512), Image.Resampling.LANCZOS)
    mono_pixels = mono_img.load()
    fg_small_pixels = fg_small.load()
    for y in range(512):
        for x in range(512):
            r, g, b, a = fg_small_pixels[x, y]
            # If bright/white (clef itself is very white), make it white, else black
            brightness = (r + g + b) / 3
            if a > 50 and brightness > 120:
                mono_pixels[x, y] = 255
    
    mono_path = os.path.join(assets_images_dir, "android-icon-monochrome.png")
    mono_img.save(mono_path, "PNG")
    print(f"Saved Android monochrome icon to {mono_path}")

if __name__ == "__main__":
    main()
