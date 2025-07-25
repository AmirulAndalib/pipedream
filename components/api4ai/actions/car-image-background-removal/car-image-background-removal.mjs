import app from "../../api4ai.app.mjs";
import {
  retryWithExponentialBackoff, representFile,
} from "../../common/utils.mjs";

export default {
  name: "Car Image Background Removal",
  description:
    "Remove Background for car images. Powered by API4AI.",
  key: "api4ai-car-image-background-removal",
  version: "0.0.2",
  type: "action",
  props: {
    app,
    alert: {
      type: "alert",
      alertType: "info",
      content: "Subscribe to [API4AI Cars Image Background Removal](https://rapidapi.com/api4ai-api4ai-default/api/cars-image-background-removal/pricing) on the RapidAPI hub before you start using it.",
    },
    image: {
      propDefinition: [
        app,
        "image",
      ],
    },
    mask: {
      type: "boolean",
      label: "Mask mode",
      description:
        "Return the foreground object mask instead of the image with the background removed.",
      default: false,
      optional: true,
    },
    representation: {
      type: "string",
      label: "Result image representation",
      description:
        "Return the result image as:\n  * **path** to a file (default)\n  * **URL** to a file hosted by api4ai (valid for 1 day)\n  * **Base64** string with file's content\n  * **Buffer** encoded in JSON with a file's content\n  * **Array** of bytes with a file's content",
      default: "Path to file",
      optional: true,
      options: [
        "Path to file",
        "URL to file",
        "Base64 string",
        "JSON Buffer",
        "Array",
      ],
    },
    shadow: {
      type: "boolean",
      label: "Draw a shadow",
      description: "Draw a shadow underneath the car.",
      default: true,
      optional: true,
    },
    hideclp: {
      type: "boolean",
      label: "Hide car license plates",
      description: "Hide car license plates.",
      default: false,
      optional: true,
    },
  },
  async run({ $ }) {
    // Initialize output.
    let summary = "";
    let result = "";
    const objects = [];
    let width = 0;
    let height = 0;

    // Prepare query params.
    let mode = "fg-mask";
    if (!this.mask) {
      mode = "fg-image";
      if (this.shadow) {
        mode += "-shadow";
      }
      if (this.hideclp) {
        mode += "-hideclp";
      }
    }
    const representation = this.representation == "URL to file"
      ? "url"
      : "base64";

    // Perform request and parse results.
    const cb = () =>
      this.app.makeRequest(
        $,
        "https://cars-image-background-removal.p.rapidapi.com/v1/results",
        this.image,
        {
          mode,
          representation,
        },
      );
    const response = await retryWithExponentialBackoff(cb);
    const isOk = response?.results?.[0]?.status?.code === "ok";
    summary = response?.results?.[0]?.status?.message || JSON.stringify(response);
    if (isOk) {
      result = response.results[0].entities[0].image;
      const rawObjects = response.results[0].entities[1].objects;
      rawObjects.forEach(function (o) {
        const box = {
          x: o.box[0],
          y: o.box[1],
          w: o.box[2],
          h: o.box[3],
        };
        const cls = Object.keys(o.entities[0].classes)[0];
        objects.push({
          class: cls,
          box: box,
        });
      });
      const format = response.results[0].entities[0].format;
      result = representFile(result, format, this.representation);
      width = response.results[0].width;
      height = response.results[0].height;
    }
    else {
      throw new Error(summary);
    }

    $.export("$summary", summary);
    $.export("result", result);
    $.export("objects", objects);
    $.export("width", width);
    $.export("height", height);
  },
};
