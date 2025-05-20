import errorMessages from "@core/config/constants";
import database from "@core/config/database";
import { HttpException } from "@core/exceptions";
import { checkExist } from "@core/utils/checkExist";
import axios from "axios";
import fs from "fs";

export const buildTree = (data: any, parentId = 0) => {
    const getChildren = (id: number) => {
        return data
            .filter((item: any) => item.parent_id === id)
            .map((child: any) => {
                const nestedChildren = getChildren(child.id);
                return nestedChildren.length
                    ? { ...child, children: nestedChildren }
                    : { ...child };
            });
    };
    if (parentId === 0) {
        return getChildren(parentId)
    } else {
        const parentNode = data.find((item: any) => item.id === parentId);
        if (!parentNode) return null;
        const children = getChildren(parentId);
        return children.length ? { ...parentNode, children } : { ...parentNode };
    }
};

export const findAllHighestParentIds = (data: any[], key: string) => {
    const map = new Map(data.map(item => [item.id, item]));
    const matchingNodes = data.filter(item =>
        item.name.toLowerCase().includes(key.toLowerCase())
    );

    if (matchingNodes.length === 0) return [];

    const highestParentIds = new Set<number>();

    for (let node of matchingNodes) {
        while (node.parent_id !== 0 && map.has(node.parent_id)) {
            node = map.get(node.parent_id);
        }
        highestParentIds.add(node.id);
    }

    return Array.from(highestParentIds);
};
export const getAllProductCategory = (data: any, targetId: number) => {
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


export const getLeafNode = async (data: any[], parentId: number[]) => {
    const results: any[] = [];

    const findChildren = async (currentId: number): Promise<any[]> => {
        let result: any[] = [];

        for (const item of data) {
            if (item.parent_id === currentId) {
                const hasChildren = await checkExist('product_category', 'parent_id', item.id);
                if (!hasChildren) {
                    result.push(item.name);
                } else {
                    const children = await findChildren(item.id); // recursively collect children
                    result = result.concat(children);
                }
            }
        }

        return result;
    };

    for (const id of parentId) {
        const children = await findChildren(id);
        results.push(...children);
    }

    return results;
};

export const getImage = async (id: number, module_code: string) => {
    try {       
        const response = await axios.get(`${process.env.UPLOAD_IMAGE_URL}/files/find-by-moduleId/${id}?module_code=${module_code}`)
        return response.data
    } catch (error) {
        return null
    }
}   
