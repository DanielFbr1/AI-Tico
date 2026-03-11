export async function fetchWikiImage(query: string): Promise<string | null> {
    const url = `https://es.wikipedia.org/w/api.php?action=query&prop=pageimages&titles=${encodeURIComponent(query)}&format=json&pithumbsize=500&origin=*`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        const pages = data.query?.pages;
        if (!pages) return null;

        // Get the first page object
        const pageId = Object.keys(pages)[0];
        const page = pages[pageId];

        if (page?.thumbnail?.source) {
            return page.thumbnail.source;
        }
        return null;
    } catch (error) {
        console.error("Error fetching wiki image:", error);
        return null;
    }
}
