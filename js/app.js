const {createApp, ref, computed} = Vue

const urlcopy = {
    props: ['url'],
    data() {
        return {
            copyText: 'Copy'
        }
    },
    methods: {
        copyToClipboard() {
            navigator.clipboard.writeText(this.url)
            this.copyText = 'Copied!'
        }
    },
    template: `
        <div class="input-group mb-3">
            <input type="text" class="form-control" v-model="url" disabled>
            <button class="btn btn-primary btn-copy" type="button" @click.native="copyToClipboard">
                {{ copyText }}
            </button>
        </div>`
}

createApp({
    components: {
        urlcopy
    },
    setup() {
        const url = ref('')
        const inputData = ref('')
        const encryptedUrl = ref('')
        const newSecret = ref(false)
        const decryptSecret = ref(false)
        const errorShow = ref(false)
        const errorTitle = ref('')
        const errorMessage = ref('')

        let publicKey, privateKey, publicKeySer, encryptedText;

        function showError(error, title, message) {
            console.log(error)
            errorShow.value = true
            errorTitle.value = title
            errorMessage.value = message
            document.body.classList.add('modal-open')
        }

        function encrypt() {
            encryptString(publicKey, inputData.value).then(
                (value) => value
            ).then(function (encryptedValue) {
                url.value = window.location.href + ';' + encryptedValue
                inputData.value = ""
            }).catch(function (error) {
                let title = 'Unable to encrypt'
                let message = 'Double check to make sure the correct link was sent.'
                showError(error, title, message)
            })
        }

        function decrypt() {
            let [pubKeySer, encryptedText] = location.hash.replace('#', '').split(';');
            load_key(window.localStorage.getItem(pubKeySer), 'decrypt').then(function (privKey) {
                return privKey;
            }).then(function (privKey) {
                return decryptString(privKey, encryptedText).then((value) => {
                    // Clear keys from local storage
                    window.localStorage.removeItem(pubKeySer); // Remove private key
                    window.localStorage.removeItem('publicKey'); // Remove public key
                    return value;
                });
            }).then(function (decryptedValue) {
                inputData.value = decryptedValue;
            }).catch(function (error) {
                let title, message;
        
                if (error.toString() === 'OperationError') {
                    title = 'Unable to decrypt';
                    message = 'Unable to decrypt secret. Make sure the url is correct and was not cut off.';
                } else {
                    title = 'Unable to load private key';
                    message = `
                    Could not find the private key associated with the public key in the URL in the browser.
                    Make sure this is the correct browser and the URL is correct.
                    Only the requester can decrypt the secret.
                    `;
                }
        
                showError(error, title, message);
            });
        }
        

        if (location.hash === '') {
            newSecret.value = true
            generateKeyPair().then(function (value) {
                url.value = location.href + '#' + value
            })
        } else if (location.hash.includes(';')) {
            decryptSecret.value = true
            decrypt()
        } else {
            load_key(location.hash.split('#')[1], 'encrypt').then(function (value) {
                publicKey = value
            }).catch(function (error) {
                let title = 'Unable to load public key'
                let message = 'Unable to load public key from the url. Make sure the url is correct.'
                showError(error, title, message)
            })
        }

        return {
            encrypt,
            encryptedUrl,
            inputData,
            newSecret,
            decryptSecret,
            url,
            errorShow,
            errorTitle,
            errorMessage
        }
    }
}).mount('#app')
