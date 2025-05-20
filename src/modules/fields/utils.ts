export const buildTree = (data: any, parentId = 0) => {
    const children = data.filter((item: any) => item.parent_id === parentId);
    return children.map((child: any) => {
        return {
            ...child,
            children: buildTree(data, child.id)
        };
    });
}

export const  getAllCategory = (data: any, targetId: number) => {
    const result: number[] = [];

    const findChildren = (currentId: number) => {
        result.push(currentId);
        data.forEach((item: any) => {
            if (item.parent_id === currentId) {
                findChildren(item.id);
            }
        });
    };

    findChildren(targetId);
    return result;
}