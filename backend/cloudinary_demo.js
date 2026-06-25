const cloudinary = require("cloudinary").v2;

// 1. Configure Cloudinary with inline credentials
cloudinary.config({
  cloud_name: "dtq9ebpe3",
  api_key: "488797625621718",
  api_secret: "Xjmym56fNO8qFVFvBu2JXc_af98"
});

const runDemo = async () => {
  try {
    const sampleImageUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";
    console.log("🚀 Starting Cloudinary demo upload...");

    // 2. Upload the sample image
    const uploadResult = await cloudinary.uploader.upload(sampleImageUrl, {
      folder: "cloudinary_onboarding"
    });

    console.log("\n✅ Image Uploaded Successfully!");
    console.log(`Secure URL: ${uploadResult.secure_url}`);
    console.log(`Public ID: ${uploadResult.public_id}`);

    // 3. Get image details (metadata)
    console.log("\n📊 Image Metadata:");
    console.log(`- Width: ${uploadResult.width}px`);
    console.log(`- Height: ${uploadResult.height}px`);
    console.log(`- Format: ${uploadResult.format}`);
    console.log(`- File Size: ${uploadResult.bytes} bytes`);

    // 4. Transform the image
    // Generate a transformed version of the image URL using f_auto (auto format) and q_auto (auto quality)
    const transformedUrl = cloudinary.url(uploadResult.public_id, {
      fetch_format: "auto", // f_auto: Automatically delivers the image in the most optimal format supported by the viewing browser (e.g., WebP or AVIF)
      quality: "auto",      // q_auto: Adjusts the quality compression levels dynamically to reduce file size without any visible drop in visual fidelity
      secure: true
    });

    console.log("\n✨ Done! Click link below to see optimized version of the image. Check the size and the format.");
    console.log(transformedUrl);

  } catch (error) {
    console.error("❌ Error running Cloudinary demo:", error.message || error);
  }
};

runDemo();
