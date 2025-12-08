# Onchain GM AI

Một Mini App trên Farcaster giúp người dùng check-in "GM" hàng ngày, mint NFT badge giả lập và tạo nội dung AI.

## Tính năng

- **Dashboard:** Theo dõi Streak và tổng số GM.
- **Onchain Simulation:** Giả lập ký giao dịch ví (Wallet Signing) trên mạng Base.
- **AI Generator:** Tạo status GM và hình ảnh GM bằng Gemini AI.
- **Lucky Wheel:** Vòng quay may mắn phong cách Neo-Brutalism.

## Cài đặt & Chạy Local

1. Clone repo:
```bash
git clone https://github.com/USERNAME/onchain-gm-ai.git
```

2. Cài đặt dependencies:
```bash
npm install
```

3. Tạo file `.env` ở thư mục gốc và thêm API Key:
```
VITE_API_KEY=your_gemini_api_key_here
```

4. Chạy dự án:
```bash
npm run dev
```

## Deploy lên Vercel

1. Import repo này vào Vercel.
2. Vào Settings > Environment Variables.
3. Thêm Key: `API_KEY` với giá trị là Gemini API Key của bạn.
4. Deploy!
