import { Result } from "./result.model.js";
import Cooperative from "../cooperative/cooperative.model.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


const questionsData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../../data/questions.json"), "utf-8")
);


const getCategoryFromQuestionId = (qid) => {
  for (const categoryObj of questionsData.Questions) {
    for (const [categoryName, questions] of Object.entries(categoryObj)) {
      const question = questions.find((q) => q.id === qid);
      if (question) {
        return categoryName;
      }
    }
  }
  return null;
};


const calculateScoresByCategory = (answers) => {
  const scoresByCategory = {};
  const countsByCategory = {};

  for (const answer of answers) {
    const category = answer.category;
    const value = parseInt(answer.value);

    if (!scoresByCategory[category]) {
      scoresByCategory[category] = 0;
      countsByCategory[category] = 0;
    }

    scoresByCategory[category] += value;
    countsByCategory[category] += 1;
  }

  
  for (const category in scoresByCategory) {
    scoresByCategory[category] =
      scoresByCategory[category] / countsByCategory[category];
  }

  return scoresByCategory;
};


const getInterpretation = (score) => {
  const scales = questionsData.Scales.GeneralInterpretation;

  for (const scale of scales) {
    const [min, max] = scale.range.split(" - ").map(parseFloat);
    if (score >= min && score <= max) {
      return scale.interpretation;
    }
  }

  return "Score hors limites";
};


const generateRecommendations = (scoresByCategory) => {
  const recommendations = [];
  const axes = questionsData.Scales.Axes;

  for (const [category, score] of Object.entries(scoresByCategory)) {
    
    let axisKey = null;
    let axisData = null;

    if (category.includes("Marketing")) {
      axisKey = "Diagnostic Marketing";
      axisData = axes["Diagnostic Marketing"];
    } else if (category.includes("Opérationnel")) {
      axisKey = "Diagnostic Opérationnel";
      axisData = axes["Diagnostic Opérationnel"];
    } else if (category.includes("Stratégique")) {
      axisKey = "Diagnostic Stratégique";
      axisData = axes["Diagnostic Stratégique"];
    }

    if (axisData) {
      const interpretation = getInterpretation(score);

      
      if (axisData.recommendations) {
        
        if (score <= 2.5) {
          recommendations.push(`${category}: ${axisData.recommendations[0]}`);
        } else if (score <= 3.5) {
          recommendations.push(`${category}: ${axisData.recommendations[1]}`);
        } else {
          recommendations.push(`${category}: ${axisData.recommendations[2]}`);
        }
      } else if (axisData.recommendations_summary) {
        
        const summaryRec = axisData.recommendations_summary.find((rec) =>
          rec
            .toLowerCase()
            .includes(category.toLowerCase().split(" - ")[1] || "")
        );
        if (summaryRec) {
          recommendations.push(`${category}: ${summaryRec}`);
        }
      }
    }
  }

  return recommendations;
};


export const createResult = async (req, res) => {
  try {
    const { cooperativeId, answers } = req.body;

    
    const cooperative = await Cooperative.findByPk(cooperativeId);
    if (!cooperative) {
      return res.status(404).json({ message: "Cooperative not found" });
    }

    
    if (!Array.isArray(answers) || answers.length === 0) {
      return res
        .status(400)
        .json({ message: "Answers must be a non-empty array" });
    }

    
    const enrichedAnswers = [];
    for (const answer of answers) {
      if (!answer.qid || !answer.value) {
        return res.status(400).json({
          message: "Each answer must have: qid and value",
        });
      }

      
      let category = answer.category;
      if (!category) {
        category = getCategoryFromQuestionId(answer.qid);
        if (!category) {
          return res.status(400).json({
            message: `Question ID ${answer.qid} not found in questions database`,
          });
        }
      }

      enrichedAnswers.push({
        qid: answer.qid,
        category: category,
        value: parseInt(answer.value),
      });
    }

    
    const scoresByCategory = calculateScoresByCategory(enrichedAnswers);

    
    const categoryScores = Object.values(scoresByCategory);
    const overallScore =
      categoryScores.reduce((sum, score) => sum + score, 0) /
      categoryScores.length;

    
    const interpretation = getInterpretation(overallScore);

    
    const recommendations = generateRecommendations(scoresByCategory);

    
    const result = await Result.create({
      cooperativeId,
      answers: enrichedAnswers,
      overallScore: parseFloat(overallScore.toFixed(2)),
      scoresByCategory,
      interpretation,
      recommendations,
    });

    
    await cooperative.update({ score: Math.round(overallScore * 20) });

    res.status(201).json({
      message: "Result created successfully",
      result,
      overallScore: parseFloat(overallScore.toFixed(2)),
      scoresByCategory,
      interpretation,
      recommendations,
    });
  } catch (error) {
    res.status(500).json({
      message: "Error creating result",
      error: error.message,
    });
  }
};


export const getAllResults = async (req, res) => {
  try {
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const offset = (page - 1) * limit;

    
    const { count, rows: results } = await Result.findAndCountAll({
      limit,
      offset,
      order: [["createdAt", "DESC"]],
    });

    
    const totalPages = Math.ceil(count / limit);

    res.json({
      results,
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
    res.status(500).json({
      message: "Error fetching results",
      error: error.message,
    });
  }
};


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


export const updateResult = async (req, res) => {
  try {
    const { answers } = req.body;
    const result = await Result.findByPk(req.params.id);

    if (!result) {
      return res.status(404).json({ message: "Result not found" });
    }

    
    if (answers) {
      if (!Array.isArray(answers) || answers.length === 0) {
        return res
          .status(400)
          .json({ message: "Answers must be a non-empty array" });
      }

      
      const enrichedAnswers = [];
      for (const answer of answers) {
        if (!answer.qid || !answer.value) {
          return res.status(400).json({
            message: "Each answer must have: qid and value",
          });
        }

        
        let category = answer.category;
        if (!category) {
          category = getCategoryFromQuestionId(answer.qid);
          if (!category) {
            return res.status(400).json({
              message: `Question ID ${answer.qid} not found in questions database`,
            });
          }
        }

        enrichedAnswers.push({
          qid: answer.qid,
          category: category,
          value: parseInt(answer.value),
        });
      }

      
      const scoresByCategory = calculateScoresByCategory(enrichedAnswers);

      
      const categoryScores = Object.values(scoresByCategory);
      const overallScore =
        categoryScores.reduce((sum, score) => sum + score, 0) /
        categoryScores.length;

      
      const interpretation = getInterpretation(overallScore);

      
      const recommendations = generateRecommendations(scoresByCategory);

      
      await result.update({
        answers: enrichedAnswers,
        overallScore: parseFloat(overallScore.toFixed(2)),
        scoresByCategory,
        interpretation,
        recommendations,
      });

      
      const cooperative = await Cooperative.findByPk(result.cooperativeId);
      if (cooperative) {
        await cooperative.update({ score: Math.round(overallScore * 20) });
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


export const getQuestions = async (req, res) => {
  try {
    res.json(questionsData);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching questions",
      error: error.message,
    });
  }
};
