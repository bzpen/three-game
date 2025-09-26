export const colors = ['linear-gradient(135deg,#5efce8,#736efe)'];

export const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length);

    return colors[randomIndex];
};
