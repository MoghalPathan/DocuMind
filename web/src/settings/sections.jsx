import { useEffect, useState } from "react";
import { Btn, Card, Row, Segmented, Select, Slider, Toggle } from "./controls.jsx";
import { currentTheme, getModel, sendCommand, setModelPref, setPref, usePrefs } from "./prefs.js";

const MODEL_OPTIONS = [
  { value: "groq", label: "Groq", hint: "gpt-oss-20b. Fast and accurate." },
  { value: "gemini", label: "Gemini", hint: "Gemini flash-lite. Powerful and versatile." },
];

export function General() {
  const p = usePrefs();
  return (
    <Card>
      <Row title="Default AI" hint="The model used for new questions. Changing it in the chat updates this too.">
        <Select label="Default AI" value={getModel("groq")} options={MODEL_OPTIONS} onChange={setModelPref} />
      </Row>
      <Row title="Send shortcut" hint="Choose which keys send a question and which add a new line.">
        <Select
          label="Send shortcut"
          value={p.sendKey}
          onChange={(v) => setPref("sendKey", v)}
          options={[
            { value: "enter", label: "Enter", hint: "Shift+Enter adds a new line" },
            { value: "ctrl", label: "Ctrl+Enter", hint: "Enter adds a new line" },
          ]}
        />
      </Row>
      <Row title="Start screen examples" hint="Show example questions on the start screen.">
        <Toggle label="Start screen examples" checked={p.examples} onChange={(v) => setPref("examples", v)} />
      </Row>
    </Card>
  );
}

export function Appearance() {
  const p = usePrefs();
  const labels = ["Small", "Normal", "Large"];
  return (
    <>
      <Card>
        <Row title="Theme" hint="Light, dark, or follow your device.">
          <Segmented
            label="Theme"
            value={currentTheme()}
            onChange={(v) => setPref("theme", v)}
            options={[
              { value: "light", label: "Light" },
              { value: "dark", label: "Dark" },
              { value: "device", label: "Device" },
            ]}
          />
        </Row>
        <Row title="Text size" hint="Size of the text in chats.">
          <Slider label="Text size" value={p.textSize} labels={labels} onChange={(v) => setPref("textSize", v)} />
        </Row>
        <Row title="Reduce motion" hint="Turns off animations.">
          <Toggle label="Reduce motion" checked={p.reduceMotion} onChange={(v) => setPref("reduceMotion", v)} />
        </Row>
      </Card>
      <p className="sx-preview" aria-label="Preview of the text size">
        Preview: The learning rate controls the step size.
      </p>
    </>
  );
}

const LANGS = [
  { value: "en-IN", label: "English (India)" },
  { value: "en-US", label: "English (US)" },
  { value: "en-GB", label: "English (UK)" },
  { value: "hi-IN", label: "Hindi" },
  { value: "mr-IN", label: "Marathi" },
];

export function Voice() {
  const p = usePrefs();
  const [voices, setVoices] = useState([]);
  const [tested, setTested] = useState(false);
  useEffect(() => {
    const synth = window.speechSynthesis;
    if (!synth) return undefined;
    const load = () => setVoices(synth.getVoices());
    load();
    synth.addEventListener && synth.addEventListener("voiceschanged", load);
    return () => synth.removeEventListener && synth.removeEventListener("voiceschanged", load);
  }, []);
  const speakOk = !!window.speechSynthesis;
  const micOk = !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  const test = () => {
    const synth = window.speechSynthesis;
    if (!synth) return;
    synth.cancel();
    const u = new SpeechSynthesisUtterance("This is how DocuMind reads answers.");
    u.rate = [0.8, 1, 1.25][p.ttsRate] ?? 1;
    const v = voices.find((x) => x.name === p.ttsVoice);
    if (v) u.voice = v;
    u.onend = () => setTested(false);
    setTested(true);
    synth.speak(u);
  };
  const voiceOptions = [{ value: "", label: "Device default" }, ...voices.slice(0, 40).map((v) => ({ value: v.name, label: v.name, hint: v.lang }))];
  return (
    <>
      {!micOk && <p className="sx-note">Voice input is not available in this browser. It works in Chrome, Edge and Safari.</p>}
      <Card>
        <Row title="Voice input language" hint="The language the microphone listens for.">
          <Select label="Voice input language" value={p.voiceLang} options={LANGS} onChange={(v) => setPref("voiceLang", v)} />
        </Row>
        <Row title="Send after speaking" hint="Send the question as soon as you stop speaking.">
          <Toggle label="Send after speaking" checked={p.autoSend} onChange={(v) => setPref("autoSend", v)} />
        </Row>
        <Row title="Reading speed" hint="Speed of the play button under answers.">
          <Slider label="Reading speed" value={p.ttsRate} labels={["Slow", "Normal", "Fast"]} onChange={(v) => setPref("ttsRate", v)} />
        </Row>
        <Row title="Reading voice" hint="The voice the play button uses.">
          <Select label="Reading voice" value={p.ttsVoice} options={voiceOptions} onChange={(v) => setPref("ttsVoice", v)} />
        </Row>
        <Row title="Try the voice" hint="Plays a short sample with your speed and voice.">
          <Btn onClick={test} disabled={!speakOk || tested}>{tested ? "Playing" : "Play sample"}</Btn>
        </Row>
      </Card>
    </>
  );
}

export function DataControls({ go }) {
  return (
    <Card>
      <Row title="Export all chats" hint="Download every chat as one text file.">
        <Btn onClick={() => sendCommand("export")}>Export</Btn>
      </Row>
      <Row title="Clear all chats" hint="Removes your chats from this browser. Your files stay.">
        <Btn danger onClick={() => { if (window.confirm("Clear all chats? Your uploaded documents stay.")) sendCommand("clear"); }}>Clear</Btn>
      </Row>
      <Row title="Delete account and data" hint="Removes your account, files and shared links for good.">
        <Btn
          danger
          onClick={() => {
            go("/");
            setTimeout(() => sendCommand("delete"), 60);
          }}
        >
          Delete
        </Btn>
      </Row>
    </Card>
  );
}
