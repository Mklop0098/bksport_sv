import errorMessages from "@core/config/constants"
import { HttpException } from "@core/exceptions"
import axios from "axios"

export const getOrderByShipperId = async (id: number) => {
    try {
        const result = await axios.get(`${process.env.DELIVERY_URL}/shipments/shipper/${id}`)
        return result.data
    } catch (error) {
        return new HttpException(404, errorMessages.SEARCH_FAILED)
    }
}