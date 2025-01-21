"use client";
import { ReactSketchCanvas } from "react-sketch-canvas";

export function Canvas(prop) {
  const styles = {
    border: "0.0625rem solid #9c9c9c",
    borderRadius: "0.25rem",
  };
  return (
    <ReactSketchCanvas
      strokeColor={prop.color}
      ref={prop.ref}
      className="absolute"
      style={styles}
      width="100%"
      height="100%"
      strokeWidth={prop.widthBrush}
      canvasColor="#e2cdbf"
    />
  );
}
