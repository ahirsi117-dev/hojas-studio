# vision

ملفات جاهزة تشتغل داخل كروم على الجهاز نفسه (بلا نت وبلا تثبيت):

- `vision_bundle.mjs` و `wasm/` : مكتبة MediaPipe Tasks Vision من قوقل (رخصة Apache 2.0).
- `selfie_segmentation.tflite` : يفصل الشخص عن الخلفية (MediaPipe · Apache 2.0).
- `face_detection_short_range.tflite` : يحدد مكان الوجه (MediaPipe · Apache 2.0).

يستخدمها `scripts/21_vision.js` فقط. ما ترسل أي شي لأي مكان: الفريمات تنقرا من مجلد المشروع والنتيجة تنكتب فيه.
المصدر: https://github.com/google-ai-edge/mediapipe
