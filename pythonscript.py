import cv2

cap = cv2.VideoCapture(
    "http://192.168.1.8:8080/video"
)

while True:
    ret, frame = cap.read()

    cv2.imshow("Frame", frame)

    if cv2.waitKey(1)==27:
        break