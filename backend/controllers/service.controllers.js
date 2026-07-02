import ServiceRequest from "../models/serviceRequest.model.js";

export const createServiceRequest = async (req, res) => {
    try {
        const { tableNumber, requestType } = req.body;
        if (!tableNumber || !requestType) {
            return res.status(400).json({ message: "tableNumber and requestType are required" });
        }

        const request = await ServiceRequest.create({
            tableNumber: tableNumber.toString(),
            requestType,
            user: req.userId || null
        });

        // Broadcast to Owner / Waiters via Sockets
        const io = req.app.get('io');
        if (io) {
            io.emit('new-service-request', request);
            io.emit('dashboard-updated');
        }

        return res.status(201).json(request);
    } catch (error) {
        return res.status(500).json({ message: `createServiceRequest error: ${error.message}` });
    }
};

export const getActiveServiceRequests = async (req, res) => {
    try {
        const requests = await ServiceRequest.find({ status: 'Pending' }).sort({ createdAt: -1 });
        return res.status(200).json(requests);
    } catch (error) {
        return res.status(500).json({ message: `getActiveServiceRequests error: ${error.message}` });
    }
};

export const completeServiceRequest = async (req, res) => {
    try {
        const { id } = req.params;
        const request = await ServiceRequest.findByIdAndUpdate(
            id,
            { status: 'Completed' },
            { new: true }
        );

        if (!request) {
            return res.status(404).json({ message: "Service request not found" });
        }

        // Broadcast resolution
        const io = req.app.get('io');
        if (io) {
            io.emit('service-request-completed', { requestId: id, tableNumber: request.tableNumber });
            io.emit('dashboard-updated');
        }

        return res.status(200).json(request);
    } catch (error) {
        return res.status(500).json({ message: `completeServiceRequest error: ${error.message}` });
    }
};
