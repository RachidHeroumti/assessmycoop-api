import Cooperative from "./cooperative.model.js";

export const createCooperative = async (req, res) => {
  try {
    const { name, address, phone, founded, founder, score } = req.body;

    const cooperative = await Cooperative.create({
      name,
      address,
      phone,
      founded,
      founder,
      score: score || 0,
    });

    res.status(201).json({
      message: "Cooperative created successfully",
      cooperative,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error creating cooperative", error: error.message });
  }
};

export const getAllCooperatives = async (req, res) => {
  try {
    // Get pagination parameters from query string
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    // Use findAndCountAll for pagination
    const { count, rows: cooperatives } = await Cooperative.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    // Calculate pagination metadata
    const totalPages = Math.ceil(count / limit);

    res.json({
      cooperatives,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems: count,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPreviousPage: page > 1,
      },
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cooperatives", error: error.message });
  }
};

export const getCooperativeById = async (req, res) => {
  try {
    const cooperative = await Cooperative.findByPk(req.params.id);

    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    res.json(cooperative);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cooperative", error: error.message });
  }
};

export const updateCooperative = async (req, res) => {
  try {
    const { name, address, phone, founded, founder, score } = req.body;
    const cooperative = await Cooperative.findByPk(req.params.id);

    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    await cooperative.update({
      name,
      address,
      phone,
      founded,
      founder,
      score,
    });

    res.json({
      message: "Cooperative updated successfully",
      cooperative,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating cooperative", error: error.message });
  }
};

export const deleteCooperative = async (req, res) => {
  try {
    const cooperative = await Cooperative.findByPk(req.params.id);

    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    await cooperative.destroy();
    res.json({ message: "Cooperative deleted successfully" });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error deleting cooperative", error: error.message });
  }
};

export const updateCooperativeScore = async (req, res) => {
  try {
    const { score } = req.body;
    const cooperative = await Cooperative.findByPk(req.params.id);

    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    if (score < 0 || score > 100) {
      return res
        .status(400)
        .json({ message: "Score must be between 0 and 100" });
    }

    await cooperative.update({ score });

    res.json({
      message: "Cooperative score updated successfully",
      cooperative,
    });
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error updating score", error: error.message });
  }
};

export const getCooperativesByScore = async (req, res) => {
  try {
    const { minScore, maxScore } = req.query;

    const cooperatives = await Cooperative.findAll({
      where: {
        score: {
          ...(minScore && { $gte: minScore }),
          ...(maxScore && { $lte: maxScore }),
        },
      },
      order: [["score", "DESC"]],
    });

    res.json(cooperatives);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error fetching cooperatives", error: error.message });
  }
};
