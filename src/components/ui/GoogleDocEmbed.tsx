
function GoogleDocEmbed() {
    const styles = {
        container: {
            width: '100%',
            height: '100%',
            overflow: 'hidden',
            flex: 1,
        },
        iframe: {
            width: '100%',
            height: '100%',
            border: 'none',
        }
    };

    return (
        <div style={styles.container}>
            <iframe
                src="https://docs.google.com/document/d/1LfesL3YNCquGUjwpSKvdH16jQRL5w9yMjbGf4Pq5bQs/edit"
                style={styles.iframe}
                title="Google Doc"
            ></iframe>
        </div>
    );
}

export default GoogleDocEmbed;