const STOPWORDS = [
"the","and","of","to","in","a","for","on",
"is","with","that","this","from","are","was",
"were","been","have","has","had","will","would",
"could","should","may","might","can","not","but",
"also","new","more","about","after","before",
"between","into","through","during","each","than",
"other","such","very","just","only","most","some",
"any","all","both","few","own","same"
];

function cleanText(text) {
return text
.toLowerCase()
.replace(/[^\w\s]/g, "");
}

function sanitizeText(text) {
return text
.replace(/&/g,"&amp;")
.replace(/</g,"&lt;")
.replace(/>/g,"&gt;")
.replace(/"/g,"&quot;")
.replace(/'/g,"&#039;");
}

function truncateText(text,maxLength=150) {
if(text.length<=maxLength) return text;
return text.slice(0,maxLength)+"...";
}

function extractKeywords(items) {

const wordCount = {};

items.forEach(item => {

const words =
cleanText(item.title)
.split(" ");

words.forEach(word => {

if (
word.length > 3 &&
!STOPWORDS.includes(word)
) {

wordCount[word] =
(wordCount[word] || 0) + 1;

}

});

});

return Object.entries(wordCount)
.sort((a,b)=>b[1]-a[1])
.slice(0,10);

}
