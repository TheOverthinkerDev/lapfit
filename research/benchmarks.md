# Benchmark CPU/GPU/laptop: tóm tắt nguồn (kiểm tra 23/11/2026)

File dữ liệu: `benchmarks.json`. Mỗi con số đều có URL nguồn (trường `sources`/`source`; `note` ghi rõ số nào lấy từ URL nào). Số nào không tìm được nguồn công bố thì để `null` và liệt kê trong `missing` là **"chưa có"**. Không có số nào là ước tính.

Nguồn chính: trang benchmark từng chip và các bài review của Notebookcheck (đa số là **trung bình trên nhiều máy**; số mẫu n và khoảng min–max ghi trong note). Ngoài ra dùng intel.com/amd.com/apple.com/nvidia.com cho thông số, cùng các review LaptopMedia, TechPowerUp, Digit, iXBT, Geeknetic, CG Mag, VNReview và Galaxus.

`map_data_js` ánh xạ chuỗi `cpu`/`gpu` trong `data.js` sang khóa của file JSON.

## Chip trong data.js

| Chip | Tình trạng |
|---|---|
| A18 Pro, M5 10 nhân, M5 Pro 18 nhân | Đủ (CB2024 + GB6) |
| **M5 Pro 15 nhân** | Thiếu một phần: CB2024 **chưa có** (chỉ có GB6, n=1) |
| Snapdragon X2 Elite | Đủ, nhưng data.js không ghi SKU (X2E-78 hay X2E-88), cần xác nhận cấu hình Surface Laptop 8 |
| **Core 3 100U** | Thiếu một phần: CB2024 single/multi **chưa có** (chỉ có GB6) |
| Core 5 210H, Core 5 320, Ultra 5 322, 225U, 325, Ultra 7 355, 356H, X7 358H, 255H, i5-13420H, i7-13620H | Đủ |
| Ryzen 7 250, 260, AI 7 350\*, AI 7 445, AI 9 465, AI Max+ 392, Ryzen 9 8940HX | Đủ (\*AI 7 350: GB6 **chưa có**) |
| GPU: Apple 5/8/10/16/20 nhân | Có Steel Nomad (Time Spy không chạy được trên macOS) |
| GPU: Radeon 840M, 8060S, Arc B390, Intel 4 Xe3, Intel 2 Xe3 (Wildcat), Intel 4-core (225U), Adreno X2, RTX 5050–5080 | Đủ Time Spy Graphics + Steel Nomad |
| GPU: **Intel UHD** (64EU và Xe G4 48EU), **Intel 2 Xe3 của Ultra 5 322** | Có Time Spy; Steel Nomad **chưa có** |

**Lưu ý quan trọng khi gộp:**
- Ultra 5 322 chỉ có iGPU **2 nhân Xe3**, không phải 4.
- RTX: điểm thay đổi nhiều theo TGP, nên dùng mảng `by_tgp` (kết quả đo từng máy) gần với TGP của máy thay vì điểm trung bình.

## Chip thị trường VN khác (ngoài data.js)

- **Có đủ dữ liệu:**
  - Intel: i5-12450H, Core 7 150U, Core 5 220H, Core 7 240H, Ultra 5 125H/135H/225H, Ultra 7 255U, Ultra 9 285H, Ultra 5 226V, Ultra 7 256V/258V, Ultra 9 288V, Ultra 7 255HX, Ultra 9 275HX, Ultra X9 388H.
  - AMD: Ryzen AI 5 340, AI 9 HX 375, Ryzen 9 8945HX.
  - Apple: M4, M5 Max.
  - Qualcomm: Snapdragon X, X Plus, X Elite (78/80), X2 Elite (78/88), X2 Elite Extreme, X2 Plus.
  - GPU: RTX 5090, 4050, 4060; Radeon 740M/760M/780M/860M/880M/890M; Arc 130V/140V/140T/130T/B370.
- **Thiếu một phần:**
  - Intel: Core 5 120U, Ultra 5 332.
  - AMD: Ryzen 5 220, 7535HS, 7435HS, AI 9 365, HX 370, AI 5 435, AI 7 450, HX 470, HX 475, AI Max 385/390, AI Max+ 395, 8745HX, 9955HX, 9955HX3D (phần lớn chỉ thiếu GB6 hoặc CB2024).
  - GPU: Radeon 820M, 8040S, 8050S.
- **Chưa có benchmark** (chỉ có thông số): Ultra 5 335, Ultra 5 338H, Ultra 7 365, Ultra 7 366H, Ultra 9 386H, Ryzen AI Max+ 388.

## Laptop (số đo thực tế từ review đúng model)

- **Có đủ CB2024 + Time Spy + pin + độ sáng:** Dell 14S DS14260, Lenovo Yoga Slim 7 OLED 14IPH11, ASUS ExpertBook Ultra B9406CAA.
- **Apple** (đủ CB2024 + pin + độ sáng; không có Time Spy): MacBook Neo, Air 13 M5, Air 15 M5, Pro 14 M5. Pro 16 M5 Pro thiếu độ sáng đo.
- **Thiếu một phần:** Zenbook 14 UM3406GA, TUF A14 (AI Max+ 392), Gigabyte A16, Nitro V 16S, TUF A14 FA401GM, Surface Laptop 8 (X2 Elite), IdeaPad Slim 3 15IPH11, Swift Go 14 AI, Legion 5 15IPH11.
- **Chưa có review đúng cấu hình:** Vivobook 14 X1404VA, Vivobook S14 S3407VA, OmniBook 5 AI 16, ThinkPad E14 Gen 7, Zephyrus G16 (5070), MSI Cyborg 15 C13WEO, HP Victus 15 fa2456TX, Aspire Lite 14, LG gram AI 14, X1 Carbon Gen 14 (356H), LOQ 15AHP11 (5050), Zephyrus G14 (5060), Strix G16 (5070 Ti / 5080, 8940HX), MacBook Pro 14 M5 Pro (15 nhân). Một số máy có số đo của cấu hình khác cùng dòng trong `proxy_*`, chỉ để tham khảo.

**Không so sánh trực tiếp thời lượng pin giữa các nguồn.** Mỗi nguồn dùng một bài test khác nhau:
- Notebookcheck: Wi‑Fi ở 150 nit.
- LaptopMedia, TechPowerUp: phát video ở 180 nit.
- Một số review khác: PCMark 10, hoặc chỉ ước lượng.

Xem trường `battery_test_type` của từng máy.

## Bổ sung đợt 2 (23/11/2026): chip trong market-vn.json

Mỗi CPU có thêm `igpu_name` và `igpu_source` (URL trang thông số của Intel, AMD hoặc Qualcomm).

| Chip | Tình trạng | iGPU (theo trang hãng) |
|---|---|---|
| Core i5-14450HX | Đủ (CB2024 n=1) | Intel UHD (16 EU) |
| Core i7-13650HX | Đủ | Intel UHD (16 EU) |
| Core 5 205H | GB6 có, CB2024 **chưa có** | **Không có iGPU** (Intel ghi "Integrated graphics disabled") |
| Core 5 315 (Wildcat Lake) | GB6 có, CB2024 **chưa có** | Intel Graphics 2 nhân Xe3 (2,3 GHz) |
| Core Ultra 5 235U | GB6 có, CB2024 **chưa có** | Intel Graphics 4 nhân Xe |
| Core i5-1334U | GB6 có, CB2024 **chưa có** | Iris Xe 80 EU khi RAM kênh đôi, nếu không thì UHD |
| **Core Ultra 7 365H** | **Không phải SKU của Intel** (intel.com chỉ có 365 và 366H) | — |
| Core Ultra 7 365 (cập nhật) | Đủ (CB2024 n=1, máy 15 W) | Intel Graphics 4 nhân Xe3 |
| Ryzen 3 5400U | GB6 có (n=1), CB2024 **chưa có** | AMD Radeon Graphics 6 CU (NBC gọi là Vega 6) |
| Ryzen 5 7520U | GB6 có (n=1), CB2024 **chưa có** | Radeon 610M (2 CU) |
| Snapdragon X X1-26-101 | GB6 có (n=1), CB2024 **chưa có** | **Adreno X1-85** (0,63 GHz); bản X1-26-100 dùng Adreno X1-45 (1,25 GHz). CPU và NPU giống nhau |

**GPU**
- Có Time Spy và Steel Nomad:
  - RTX 3050 Laptop 4 GB: TS 4448, SN 195,3. SN chỉ từ 4 máy mỏng, công suất thấp.
  - Radeon 610M: TS 528, SN 120,7. Số trung bình lẫn cả chip desktop/HX; riêng 7520U đo được TS 515.
  - iGPU của Core 5 120U: NBC ghi là Iris Xe G7 80EU, TS 1175, SN 155.
  - iGPU của Ultra 5 235U: TS 1855, SN 391,3 (trung bình của dòng "Intel Graphics 4-Core").
  - iGPU của Core 5 315: TS 1385, SN 265. Đo trên máy chạy 320/350 với xung GPU cao hơn, nên với 315 chỉ là **mức trần**.
- Có Time Spy, Steel Nomad **chưa có**: RTX 3050 6 GB (TS 4631, n=3), Vega 6 (TS 821, không có máy 5400U nào).
- **Chưa có:** iGPU Ultra 5 135H ở chế độ "Intel Graphics" (RAM kênh đơn hoặc dưới 16 GB). NBC chỉ có số ở chế độ Arc: TS 3230, SN 702.

**Lưu ý:**
- Với 120U, 235U và 315, số GPU là trung bình của cả dòng iGPU, không phải đo riêng trên CPU đó.
- Laptop RTX 3050 nên dùng mảng `by_tgp`.

## Đợt 3 (23/11/2026): máy giá rẻ trong market-vn.json và iGPU cho mọi CPU

**Mỗi CPU trong file (102 chip) giờ có thêm:**
- `igpu_key`: tên khóa iGPU trong mục `gpus`.
- `igpu_source`: link trang thông số của hãng (Intel, AMD, Apple hoặc Qualcomm).
- `igpu_name_vendor`: tên iGPU đúng như hãng ghi.
- `igpu_key_alt` và `igpu_key_note`: dùng khi tên iGPU phụ thuộc RAM:
  - Iris Xe cần RAM kênh đôi, nếu không thì máy báo UHD.
  - Arc trên Meteor/Arrow Lake H cần 16 GB RAM kênh đôi trở lên, nếu không thì báo "Intel Graphics".

**`igpu_key` = null (không phải lỗi):**
- **Core 5 205H** và **Ryzen 7 7435HS**: không có iGPU (hãng ghi tắt iGPU hoặc bắt buộc card rời).
- **Core Ultra 7 365H**: không có trên intel.com.
- **Apple M4**: chưa có entry GPU M4 trong file.

| CPU mới | Tình trạng | iGPU (`igpu_key`) |
|---|---|---|
| i5-1235U | Đủ (CB2024 n=1) | Iris Xe G7 80EU (TS 1175, SN 155) |
| i5-13450HX | Đủ (CB2024 n=1) | UHD 16EU (TS 344,7; SN chưa có) |
| Core Ultra 9 386H | Đủ (trước chỉ có thông số) | Intel Graphics 4 Xe3 |
| i3-1215U | GB6 có, CB2024 chưa có | UHD 64EU |
| Core 3 N350 | GB6 có (n=1), CB2024 chưa có | Intel Graphics 32EU (TS 567, đo trên N305/N355; SN chưa có) |
| Core 3 304 (Wildcat Lake) | GB6 có, CB2024 chưa có | Intel Graphics **1 nhân Xe3** (TS 753, n=1; SN chưa có) |
| Ryzen 5 7430U | Đủ | Vega 7 (TS 980, SN 160,5) |
| Ryzen 7 7730U | Đủ (CB2024 chỉ từ 1 mini PC) | Vega 8 (TS 1144, SN 235,5) |
| Ryzen 7 7735HS | Đủ | Radeon 680M (TS 2195, SN 317,8) |
| Ryzen 5 8645HS | Đủ (n=1) | Radeon 760M |
| Ryzen AI 7 345 | Đủ (CB2024 n=1) | Radeon 840M |
| **"Ryzen AI 7 260"** | Không có trên amd.com; spec MSI VN ghi **Ryzen 7 260**, nên dùng chung số liệu (`alias_of`) | Radeon 780M |
| Ryzen 3 3200U | GB6 có, CB2024 chưa có | Vega 3 (TS 371,8; SN chưa có) |
| Ryzen 5 125, Ryzen 7 155, Ryzen 7 7445HS | GB6 có (n=1), CB2024 chưa có | Radeon 740M |
| Ryzen AI 5 330 | GB6 có, CB2024 chưa có | Radeon 820M |
| Ryzen 5 7533HS | **Chưa có** benchmark (NBC chưa có trang) | Radeon 660M (TS 1450, SN 229,7) |

**Kiểm tra lại CB2024: vẫn chưa có** cho Core 3 100U, Core 5 205H, Core 5 315, Ultra 5 235U, i5-1334U, Ryzen 5 7520U, Ryzen 3 5400U, Snapdragon X1-26-101 và M5 Pro 15 nhân. Trang NBC của M5 Pro 15 nhân chỉ có Cinebench 2026. Kết quả kiểm tra nằm trong trường `recheck_2026_11_23`.

**RTX 3050 6 GB:** Steel Nomad vẫn chưa có; LaptopMedia chỉ có Steel Nomad Light, là bài test khác. **RTX 2050:** bỏ qua vì không model nào trong market-vn.json dùng.

**Lưu ý khi dùng:**
- **Snapdragon X1-26-101:** `igpu_key` trỏ tới Adreno X1-85, nhưng ở chip này GPU chỉ chạy tối đa 0,63 GHz (bản X1E chạy 1,25 GHz). Vì vậy **không dùng được** điểm trung bình của X1-85 cho chip này.
- **Core 7 150U, Core 5 220H, Core 3 100U:** Intel gọi iGPU là "Intel Graphics"; đã map theo số EU (96, 80 và 64).
- **M5 và M5 Max:** cùng CPU nhưng có bản GPU 8 nhân (M5) và 32 nhân (M5 Max), xem `igpu_key_alt`.
- **Số mẫu ít:** iGPU 16EU, N350 và Steel Nomad của Iris Xe 96EU đều đo trên máy khác loại (chi tiết trong note).
