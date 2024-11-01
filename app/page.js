"use client";

import { ReactSketchCanvas } from "react-sketch-canvas";
import { HexColorPicker } from "react-colorful";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { UserButton, useUser } from "@clerk/nextjs";
import axios from "axios";
import uniqid from "uniqid";

export default function HomePage() {
  const [pageState, setPagetState] = useState({
    picker: false,
    eraseMode: false,
    createId: false,
  });
  const [color, setColor] = useState("#20285c");
  const firstRef = useRef();
  const styles = {
    height: "95vh",
    width: "100vw",
  };
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (window) {
      document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "z") {
          firstRef.current.undo();
        }
        if (event.ctrlKey && event.key === "y") {
          firstRef.current.redo();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (pageState.createId) {
      axios
        .post("http://localhost:8080/path", {
          id: uniqid(),
          path: firstRef.current.exportPaths(),
        })
        .catch((e) => console.log(e))
        .then((e) => console.log(e));
      console.log("success");
      setPagetState({ ...pageState, createId: false });
    }
  }, [pageState.createId]);

  function downloadImage() {
    firstRef.current.exportImage("jpg").then((dataUrl) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "my_drawing.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  if (user.isLoaded) {
    return (
      <div id="parent" className="w-[100vw] h-[100vh] flex flex-col">
        {/* prototype */}
        {/* <div className="notification">
          <svg
            height={30}
            width={30}
            fill="#20285c"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
          >
            <path d="M256 32c14.2 0 27.3 7.5 34.5 19.8l216 368c7.3 12.4 7.3 27.7 .2 40.1S486.3 480 472 480L40 480c-14.3 0-27.6-7.7-34.7-20.1s-7-27.8 .2-40.1l216-368C228.7 39.5 241.8 32 256 32zm0 128c-13.3 0-24 10.7-24 24l0 112c0 13.3 10.7 24 24 24s24-10.7 24-24l0-112c0-13.3-10.7-24-24-24zm32 224a32 32 0 1 0 -64 0 32 32 0 1 0 64 0z" />
          </svg>
        </div> */}
        <ReactSketchCanvas
          ref={firstRef}
          canvasColor="#e7eaea"
          style={styles}
          strokeColor={color}
        />
        <div className="flex bg-[#8cb9e0]">
          <div className="p-[20px] w-[50%] flex gap-[10px]">
            <UserButton />
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
              height={30}
              width={30}
              fill={color}
              title="color picker"
              className="modeButt"
              onClick={() => {
                setPagetState((prevState) => {
                  return { prevState, picker: !prevState.picker };
                });
              }}
            >
              <title>color picker</title>
              <path d="M50.8 333.3c-12 12-18.8 28.3-18.8 45.3V424L0 480l32 32 56-32h45.5c17 0 33.3-6.7 45.3-18.7l126.6-126.6-128-128L50.8 333.3zM483.9 28.1c-37.5-37.5-98.3-37.5-135.8 0l-77.1 77.1-13.1-13.1c-9.4-9.4-24.7-9.3-33.9 0l-41 41c-9.4 9.4-9.4 24.6 0 33.9l161.9 161.9c9.4 9.4 24.7 9.3 33.9 0L419.9 288c9.4-9.4 9.4-24.6 0-33.9l-13.1-13.1 77.1-77.1c37.5-37.5 37.5-98.3 0-135.8z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 576 512"
              height={30}
              width={30}
              fill="#20285c"
              className="modeButt"
              onClick={() => {
                firstRef.current.eraseMode(!pageState.eraseMode);
                setPagetState({
                  ...pageState,
                  eraseMode: !pageState.eraseMode,
                });
              }}
            >
              <title>eraser</title>
              <path d="M290.7 57.4L57.4 290.7c-25 25-25 65.5 0 90.5l80 80c12 12 28.3 18.7 45.3 18.7L288 480l9.4 0L512 480c17.7 0 32-14.3 32-32s-14.3-32-32-32l-124.1 0L518.6 285.3c25-25 25-65.5 0-90.5L381.3 57.4c-25-25-65.5-25-90.5 0zM297.4 416l-9.4 0-105.4 0-80-80L227.3 211.3 364.7 348.7 297.4 416z" />
            </svg>
            <svg
              onClick={() => {
                // firstRef.current.exportImage("jpg"),
                // "huTao .jpg"
                downloadImage();
              }}
              height={30}
              width={30}
              fill="#20285c"
              className="modeButt"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 512 512"
            >
              <title>download the canvas picture</title>
              <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
            </svg>
            {/* <svg
              height={30}
              className="modeButt"
              width={30}
              fill="#20285c"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
            >
              <path d="M0 336c0 79.5 64.5 144 144 144l368 0c70.7 0 128-57.3 128-128c0-61.9-44-113.6-102.4-125.4c4.1-10.7 6.4-22.4 6.4-34.6c0-53-43-96-96-96c-19.7 0-38.1 6-53.3 16.2C367 64.2 315.3 32 256 32C167.6 32 96 103.6 96 192c0 2.7 .1 5.4 .2 8.1C40.2 219.8 0 273.2 0 336z" />
            </svg> */}
            <svg
              height={30}
              width={30}
              fill="#20285c"
              className="modeButt"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              onClick={() => {
                firstRef.current.clearCanvas();
              }}
            >
              <title>clear the canvas</title>
              <path d="M32 464a48 48 0 0 0 48 48h288a48 48 0 0 0 48-48V128H32zm272-256a16 16 0 0 1 32 0v224a16 16 0 0 1 -32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1 -32 0zm-96 0a16 16 0 0 1 32 0v224a16 16 0 0 1 -32 0zM432 32H312l-9.4-18.7A24 24 0 0 0 281.1 0H166.8a23.7 23.7 0 0 0 -21.4 13.3L136 32H16A16 16 0 0 0 0 48v32a16 16 0 0 0 16 16h416a16 16 0 0 0 16-16V48a16 16 0 0 0 -16-16z" />
            </svg>

            {/* <svg
              version="1.0"
              xmlns="http://www.w3.org/2000/svg"
              height={30}
              width={30}
              title="login"
              className="modeButt"
              fill="#20285c"
              viewBox="0 0 512.000000 512.000000"
              preserveAspectRatio="xMidYMid meet"
            >
              <g
                transform="translate(0.000000,512.000000) scale(0.100000,-0.100000)"
                stroke="none"
              >
                <path
                  d="M2146 4869 c-62 -15 -153 -68 -197 -116 -22 -24 -55 -74 -72 -111
l-32 -67 -3 -219 c-4 -265 0 -290 72 -361 103 -103 244 -100 339 5 57 64 67
101 67 264 l0 136 1040 0 1040 0 0 -1840 0 -1840 -1040 0 -1040 0 0 136 c0
163 -10 200 -67 264 -95 105 -236 108 -339 5 -72 -71 -76 -96 -72 -362 l3
-219 37 -76 c45 -91 103 -147 196 -191 l67 -32 1215 0 1215 0 67 32 c93 44
151 100 196 191 l37 76 0 2015 0 2016 -32 67 c-44 93 -100 151 -191 196 l-76
37 -1195 2 c-701 1 -1212 -3 -1235 -8z"
                />
                <path
                  d="M2733 3699 c-114 -21 -194 -117 -194 -234 0 -93 13 -112 299 -397
l267 -268 -1329 0 c-1014 0 -1338 -3 -1370 -12 -86 -26 -166 -136 -166 -228 0
-92 80 -202 166 -228 32 -9 356 -12 1370 -12 l1329 0 -267 -267 c-177 -177
-272 -281 -283 -305 -21 -51 -19 -144 4 -193 23 -49 74 -99 123 -119 51 -22
143 -20 193 3 27 13 199 179 531 512 521 524 514 516 514 609 0 93 7 85 -514
608 -270 271 -503 500 -519 508 -40 21 -106 31 -154 23z"
                />
              </g>
            </svg> */}
            {user.isSignedIn ? null : (
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="modeButt"
                height={30}
                width={30}
                fill="#20285c"
                onClick={() => {
                  router.push("/sign-up");
                }}
                viewBox="0 0 448 512"
              >
                <title>sign up</title>
                <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z" />
              </svg>
            )}
            <svg
              className="modeButt"
              height={30}
              width={30}
              fill="#20285c"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 640 512"
              onClick={() => setPagetState({ ...pageState, createId: true })}
            >
              <title>connect with your friends</title>
              <path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z" />
            </svg>
          </div>
          <div className="p-[20px] w-[50%] flex gap-[10px] justify-end">
            <svg
              height={30}
              width={30}
              fill="#20285c"
              className="modeButt"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              onClick={() => {
                firstRef.current.undo();
              }}
            >
              <title>undo</title>
              <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
            </svg>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 448 512"
              height={30}
              width={30}
              fill="#20285c"
              onClick={() => {
                firstRef.current.redo();
              }}
              className="modeButt"
            >
              <title>redo</title>
              <path d="M438.6 278.6c12.5-12.5 12.5-32.8 0-45.3l-160-160c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L338.8 224 32 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l306.7 0L233.4 393.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l160-160z" />
            </svg>
            {/* <button
              onClick={() => {
                console.log(firstRef.current.exportPaths());
              }}
            >
              refresh path
            </button> */}
          </div>
        </div>
        {pageState.picker ? (
          <HexColorPicker
            className="!absolute top-[70vh] left-[10px]"
            color={color}
            onChange={setColor}
          />
        ) : null}
      </div>
    );
  }
}
