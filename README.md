# Interactive Support Vector Machine (SVM) Visualizer
## 📌 Assignment Specification (รายละเอียดงานมอบหมาย)

> **Assignment รายละเอียดงานมอบหมาย (รวม 35 คะแนน)**  
> **กำหนดส่งและตรวจงาน:** ต้นเดือนตุลาคม  
> **ข้อ 2: Interactive Algorithm Visualizer Web Page (15 คะแนน)**  
> 
> ให้นักศึกษาสร้าง Single-Page Web Application รวมอยู่ใน 1 ไฟล์ HTML เท่านั้น (Embedded HTML, CSS, JavaScript) เพื่ออธิบายการทำงานของอัลกอริทึมให้เข้าใจง่ายทีละขั้นตอน (เน้นหลักการทางคณิตศาสตร์ให้มือใหม่เข้าใจง่าย) โดยต้อง Deploy ขึ้น GitHub Pages ได้ และเนื้อหาทั้งหมดเป็นภาษาอังกฤษ  
> *(หัวข้ออัลกอริทึมจะใช้การจับฉลาก เช่น Logistic Regression, Decision Tree, AdaBoost, KNN, K-Means, DBSCAN, User-based Collaborative Filtering เป็นต้น)*
>
> ### รายละเอียดและ Layout ของหน้าเว็บ:
> - **Theme:** พื้นหลังสีดำ มีความสวยงามและ Professional
> - **Header:** มีข้อความอธิบายหัวข้อและหลักการสั้นๆ
> - **Footer:** ความสูงพอเหมาะ แสดงรายชื่อสมาชิกในกลุ่ม และ CE KMITL
> - **Body:** แบ่งเป็น 2 ฝั่ง (ซ้าย-ขวา) ลักษณะ Floating และมี Scrollbar แนวตั้งแยกกัน
> - **ฝั่งซ้าย:**
>   - **(ด้านซ้ายบน) Data Canvas/Input:** พื้นที่จัดการจุดข้อมูล รองรับทั้งการสุ่มข้อมูล (Random) และให้ผู้ใช้คลิกสร้าง/ลบจุดข้อมูลได้เอง
>   - **(ด้านซ้ายล่าง) Hyperparameter & Controls:** แผงปรับแต่ง Hyperparameters ของอัลกอริทึม พร้อมปุ่มควบคุม ได้แก่ Step-by-step Execution และ Play until Convergence
> - **ฝั่งขวา:**
>   - **(ด้านขวาบน) Model State / Structure:** แสดงการเปลี่ยนแปลงสถานะภายในของโมเดลทีละขั้นเพื่อให้เข้าใจง่าย (เช่น เมทริกซ์, โครงสร้างข้อมูล, เวกเตอร์น้ำหนัก)
>   - **(ด้านขวาล่าง) Loss Graph:** กราฟแสดงค่า Loss ที่ค่อยๆ ลดลงในแต่ละ Step/Epoch
> - **Interaction:** เมื่อโมเดลอัปเดต (Step/Converge) บริเวณ Data Canvas ฝั่งซ้ายบนจะต้องแสดงผลการประมวลผลและการเปลี่ยนแปลงอย่างชัดเจน (เช่น เส้นแบ่ง Decision Boundary หรือสีของ Cluster)
> 
> **ตัวอย่างอ้างอิง:** [https://github.com/LLM-CE-KMITL/learning](https://github.com/LLM-CE-KMITL/learning)