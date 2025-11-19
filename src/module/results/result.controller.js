import { Result } from "./result.model.js";
import Cooperative from "../cooperative/cooperative.model.js";

// Create a new result for a cooperative
export const createResult = async (req, res) => {
  try {
    const { cooperativeId, questions } = req.body;

    // Validate cooperative exists
    const cooperative = await Cooperative.findByPk(cooperativeId);
    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    // Validate questions array
    if (!Array.isArray(questions) || questions.length === 0) {
      return res
        .status(400)
        .json({ message: "Questions must be a non-empty array" });
    }

    // Validate each question has required fields
    for (const q of questions) {
      if (!q.question || !q.answer || q.score === undefined || !q.category) {
        return res.status(400).json({
          message:
            "Each question must have: question, answer, score, and category",
        });
      }
    }

    // Calculate total score from questions
    const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);

    // Create result
    const result = await Result.create({
      cooperativeId,
      questions,
    });

    // Update cooperative score
    await cooperative.update({ score: totalScore });

    res.status(201).json({
      message: "Result created successfully",
      result,
      totalScore,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating result",
      error: error.message,
    });
  }
};

// Get all results
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.findAll({
      order: [["createdAt", "DESC"]],
    });
    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching results",
      error: error.message,
    });
  }
};

// Get result by ID
export const getResultById = async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    res.json(result);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching result",
      error: error.message,
    });
  }
};

// Get results by cooperative ID
export const getResultsByCooperativeId = async (req, res) => {
  try {
    const { cooperativeId } = req.params;

    const results = await Result.findAll({
      where: { cooperativeId },
      order: [["createdAt", "DESC"]],
    });

    res.json(results);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching results",
      error: error.message,
    });
  }
};

// Update result
export const updateResult = async (req, res) => {
  try {
    const { questions } = req.body;
    const result = await Result.findByPk(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    // Validate questions array if provided
    if (questions) {
      if (!Array.isArray(questions) || questions.length === 0) {
        return res
          .status(400)
          .json({ message: "Questions must be a non-empty array" });
      }

      // Validate each question
      for (const q of questions) {
        if (!q.question || !q.answer || q.score === undefined || !q.category) {
          return res.status(400).json({
            message:
              "Each question must have: question, answer, score, and category",
          });
        }
      }

      // Calculate new total score
      const totalScore = questions.reduce((sum, q) => sum + (q.score || 0), 0);

      // Update result
      await result.update({ questions });

      // Update cooperative score
      const cooperative = await Cooperative.findByPk(result.cooperativeId);
      if (cooperative) {
        await cooperative.update({ score: totalScore });
      }
    }

    res.json({
      message: "Result updated successfully",
      result,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating result",
      error: error.message,
    });
  }
};

// Delete result
export const deleteResult = async (req, res) => {
  try {
    const result = await Result.findByPk(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    await result.destroy();
    res.json({ message: "Result deleted successfully" });
  } catch (error) {
    res.status(500).json({
      message: "Error deleting result",
      error: error.message,
    });
  }
};
