function saveData(key, data) {

localStorage.setItem(
key,
JSON.stringify(data)
);

}

function loadData(key) {

const raw =
localStorage.getItem(key);

return raw
? JSON.parse(raw)
: null;

}
