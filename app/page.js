"use client";

import { useRef, useState, useEffect, useId } from "react";
import { HexColorPicker } from "react-colorful";
import { Canvas } from "./components/Canvas";
import axios from "axios";

export default function HomePage() {
  const [pageState, setPageState] = useState({
    color: "#996466",
    widthBrush: 4,
    colorPicker: false,
    roomPopup: false,
    broadcats: false,
    broadcatsType: undefined,
  });
  const CanvasRef = useRef();
  const CreatingRoomId = useId();

  // console.log(CanvasRef.current.exportPaths());
  function downloadImage() {
    CanvasRef.current.exportImage("jpg").then((dataUrl) => {
      const link = document.createElement("a");
      link.href = dataUrl;
      link.download = "my_drawing.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  }
  useEffect(() => {
    if (window) {
      document.addEventListener("keydown", function (event) {
        if (event.ctrlKey && event.key === "z") {
          CanvasRef.current.undo();
        }
        if (event.ctrlKey && event.key === "y") {
          CanvasRef.current.redo();
        }
      });
    }
  }, []);

  async function createRoom() {
    // fetch("http://localhost:8080/path/" + CreatingRoomId, {
    //   method: "POST",
    //   body: JSON.stringify({
    //     id: CreatingRoomId,
    //     path: CanvasRef.current.exportPaths(),
    //     mode: "default",
    //   }),
    //   headers: {
    //     "Content-type": "application/json; charset=UTF-8",
    //   },
    // })
    const data = JSON.stringify({
      id: CreatingRoomId,
      path: await CanvasRef.current.exportPaths(),
      mode: "default",
    });
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "http://localhost:8080/path/6969",
      headers: {
        "Content-Type": "application/json",
      },
      data: data,
    };

    axios
      .request(config)
      .then((response) => {
        console.log(response.data);
      })
      .catch((error) => {
        console.log(error);
      });

    setPageState({
      ...pageState,
      broadcats: true,
      roomPopup: false,
      broadcatsType: "create",
    });
  }

  // useEffect(()=>{
  //   while(pageState.broadcats){

  //   }
  // },[])
  console.log(pageState);
  return (
    <div className="mainPages">
      {pageState.roomPopup && (
        <div
          onClick={() => {
            setPageState({ ...pageState, roomPopup: false });
          }}
          className="fixed z-50 items-center justify-center flex w-[100%] h-[100%]"
        >
          <div className="bg-[#f1e6df] fixed z-[100] flex justify-center items-center gap-[10px] h-[150px] w-[20%] p-[20px] rounded-[10px]">
            <h1 className="text-center text-[20px]">
              Connect with your friends
            </h1>
            <button onClick={() => createRoom()} className="defaultButton">
              Create
            </button>
            <button
              onClick={() => console.log("join")}
              className="defaultButton"
            >
              join
            </button>
          </div>
        </div>
      )}
      {pageState.broadcatsType === "create" ? (
        <p
          onClick={() => navigator.clipboard.writeText(CreatingRoomId)}
          className=" select-text absolute z-10 top-[95%] right-10"
        >
          room Id: {CreatingRoomId}
        </p>
      ) : null}

      <Canvas
        ref={CanvasRef}
        color={pageState.color}
        widthBrush={pageState.widthBrush}
      />
      <div className="sidebar">
        <div className="sidebarChild gap-[10px]">
          <svg
            className="icons"
            fill="#4a2e31"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 448 512"
            onClick={() =>
              setPageState((prev) => {
                return { ...prev, colorPicker: !prev.colorPicker };
              })
            }
          >
            <title>color picker</title>
            <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
          </svg>
          <svg
            onClick={() => {
              setPageState({ ...pageState, roomPopup: true });
            }}
            className="icons"
            fill="#4a2e31"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 640 512"
          >
            <title>link your friends</title>
            <path d="M579.8 267.7c56.5-56.5 56.5-148 0-204.5c-50-50-128.8-56.5-186.3-15.4l-1.6 1.1c-14.4 10.3-17.7 30.3-7.4 44.6s30.3 17.7 44.6 7.4l1.6-1.1c32.1-22.9 76-19.3 103.8 8.6c31.5 31.5 31.5 82.5 0 114L422.3 334.8c-31.5 31.5-82.5 31.5-114 0c-27.9-27.9-31.5-71.8-8.6-103.8l1.1-1.6c10.3-14.4 6.9-34.4-7.4-44.6s-34.4-6.9-44.6 7.4l-1.1 1.6C206.5 251.2 213 330 263 380c56.5 56.5 148 56.5 204.5 0L579.8 267.7zM60.2 244.3c-56.5 56.5-56.5 148 0 204.5c50 50 128.8 56.5 186.3 15.4l1.6-1.1c14.4-10.3 17.7-30.3 7.4-44.6s-30.3-17.7-44.6-7.4l-1.6 1.1c-32.1 22.9-76 19.3-103.8-8.6C74 372 74 321 105.5 289.5L217.7 177.2c31.5-31.5 82.5-31.5 114 0c27.9 27.9 31.5 71.8 8.6 103.9l-1.1 1.6c-10.3 14.4-6.9 34.4 7.4 44.6s34.4 6.9 44.6-7.4l1.1-1.6C433.5 260.8 427 182 377 132c-56.5-56.5-148-56.5-204.5 0L60.2 244.3z" />
          </svg>
          <svg
            onClick={() => downloadImage()}
            className="icons"
            fill="#4a2e31"
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 512 512"
          >
            <title>download image</title>
            <path d="M288 32c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 242.7-73.4-73.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3l128 128c12.5 12.5 32.8 12.5 45.3 0l128-128c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L288 274.7 288 32zM64 352c-35.3 0-64 28.7-64 64l0 32c0 35.3 28.7 64 64 64l384 0c35.3 0 64-28.7 64-64l0-32c0-35.3-28.7-64-64-64l-101.5 0-45.3 45.3c-25 25-65.5 25-90.5 0L165.5 352 64 352zm368 56a24 24 0 1 1 0 48 24 24 0 1 1 0-48z" />
          </svg>
        </div>
        {pageState.colorPicker && (
          <div className="flex flex-col gap-[10px] justify-center items-center popFromLeft">
            <HexColorPicker
              color={pageState.color}
              onChange={(e) => setPageState({ ...pageState, color: e })}
              className="ml-[10px]"
            />
            {/* <div className="flex gap-[5px]">
              <button
                onClick={() => setPageState({ ...pageState, color: "#140c0d" })}
                className="border-2 flex justify-center items-center border-[#140c0d] h-[30px] w-[30px] rounded-[50%]"
              >
                <div className="bg-[#140c0d] rounded-[50%] h-[22px] w-[22px]"></div>
              </button>
              <button
                onClick={() => setPageState({ ...pageState, color: "#cb4842" })}
                className="border-0 flex justify-center items-center border-[#cb4842] h-[30px] w-[30px] rounded-[50%]"
              >
                <div className="bg-[#cb4842] rounded-[50%] h-[22px] w-[22px]"></div>
              </button>
            </div> */}
            {/* #cb4842 */}
          </div>
        )}
      </div>
    </div>
  );
}
