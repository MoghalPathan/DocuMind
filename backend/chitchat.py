import re

# Messages that are just conversation. They never need a document search.
_GREET = {
    "hi", "hii", "hiii", "hello", "helo", "hey", "heyy", "hola", "yo", "namaste",
    "hi there", "hello there", "hey there", "hi documind", "hello documind", "hey documind",
    "good morning", "good afternoon", "good evening", "good day", "gm",
}
_THANKS = {
    "thanks", "thank you", "thankyou", "thanks a lot", "thank you so much", "thank you very much",
    "thx", "ty", "cheers", "great", "awesome", "nice", "cool", "perfect", "ok", "okay", "got it",
    "okay thanks", "ok thanks", "ok thank you", "great thanks", "nice thanks",
}
_BYE = {"bye", "goodbye", "see you", "see you later", "good night", "cya", "bye bye"}
_HOW = {"how are you", "how are you doing", "hows it going", "whats up", "wassup", "sup"}
_WHO = {
    "who are you", "what are you", "what is documind", "what can you do", "what do you do",
    "help", "how does this work", "how do i use this", "how to use", "how to use this",
}

REPLIES = {
    "greet": "Hi! I'm DocuMind. Upload a PDF, then ask me anything about it. I answer only from your documents and show the pages I used.",
    "thanks": "You're welcome! Ask another question whenever you like.",
    "bye": "Goodbye! Your documents stay saved for next time.",
    "how": "I'm doing well, thanks! What would you like to know from your documents?",
    "who": "I'm DocuMind. Upload a PDF, ask a question, and I'll answer using only that document, with clickable page references. If the answer isn't in the PDF, I'll say so instead of guessing.",
}


def _clean(text):
    text = text.lower().replace("’", "'").replace("'", "")
    text = re.sub(r"[^a-z ]", " ", text)
    return re.sub(r"\s+", " ", text).strip()


def small_talk(question):
    """Returns a ready reply for greetings, thanks and similar. Otherwise None."""
    t = _clean(question)
    if not t:
        return None
    for key, words in (("greet", _GREET), ("thanks", _THANKS), ("bye", _BYE), ("how", _HOW), ("who", _WHO)):
        if t in words:
            return REPLIES[key]
    return None
