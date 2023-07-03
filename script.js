///<reference path="jquery.min.js" />

class NotesCollection {

    #currentItem;
    notes = [];

    get currentItem() {
        console.log("getted")
        return this.#currentItem;
    }

    set currentItem(value) {
        this.#currentItem = value;
        console.log("setted")
        this.saveCurrentItem();
    }

    changeItemBody(id, body) {
        let item = this.notes.find(x => x.id == id);
        item.body = body;

        this.saveItems();
    }

    changeItemTitle(id, title) {
        let item = this.notes.find(x => x.id == id);
        item.title = title;

        this.saveItems();
    }

    createItem() {
        let newItem = { id: this.generateId(), title: 'New note', body: "" };
        this.notes.push(newItem);

        this.saveItems();
    }

    removeItem(id) {
        let item = this.notes.find(x => x.id == id);
        this.notes = this.notes.filter(x => x.id != id);
        this.saveItems();
    }

    async init() {
        let items = await this.getItems();
        this.notes = Array.from(items);
        this.#currentItem = await this.getCurrentItem();

        refreshNotes();
    }

    async saveItems() {
        chrome.storage.sync.set({ items: this.notes });
        refreshNotes();
    }

    async getItems() {
        let data = await chrome.storage.sync.get("items");
        return data.items;
    }

    async getCurrentItem() {
        let data = await chrome.storage.sync.get('currentItem');
        return data.currentItem;
    }

    saveCurrentItem() {
        chrome.storage.sync.set({ currentItem: this.#currentItem })
    }

    generateId() {
        return new Date()
            .toLocaleString()
            .replaceAll(".", "")
            .replaceAll(':', '')
            .replace(', ', '') + new Date().getMilliseconds();
    };
}

let globalNotes = new NotesCollection();

window.onload = function () {
    globalNotes = new NotesCollection();
    globalNotes.init();
};

function refreshNotes() {
    $('#list').children().remove();
    globalNotes.notes.forEach(x => {
        let newItem = document.createElement('button');
        newItem.classList.add('list-item');
        newItem.setAttribute('itemId', x.id);
        newItem.setAttribute('body', x.body);
        newItem.textContent = x.title;

        $('#list').append(newItem);

        $('.list-item').on('click', function () {
            onItemClicked($(this));
        });
    });

    let currentItemData = globalNotes.notes.find(x => x.id == globalNotes.currentItem);
    selectItem(globalNotes.currentItem, currentItemData.title, currentItemData.body)
}

function onItemClicked(item) {
    let id = item.attr('itemid');
    let body = item.attr('body');
    let title = item.text();

    selectItem(id, title, body);
    globalNotes.currentItem = id;
}

$('#body-text').on('blur', function () {
    let id = getSelectedItemId();
    let body = $(this).val()

    globalNotes.changeItemBody(id, body)
});

$('.title-input').on('blur', function () {
    let id = getSelectedItemId();
    let title = $(this).val()

    globalNotes.changeItemTitle(id, title)
});

function getSelectedItemId() {
    return $('.selected').first().attr('itemid');
}

$('#add-btn').on('click', function () {
    globalNotes.createItem();
});

$('#trash-btn').on('click', function () {
    let itemId = $('.selected').attr('itemid')
    globalNotes.removeItem(itemId);
});

function selectItem(id, title, body) {
    $('.selected').removeClass('selected');

    let item = $(`[itemId="${id}"]`).first();
    item.addClass('selected');
    
    $('#body-text').val(body)
    $('.title-input').val(title)
}
