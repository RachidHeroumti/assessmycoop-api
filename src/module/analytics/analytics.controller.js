import {Result} from "../results/result.model.js";
import Cooperative from "../cooperative/cooperative.model.js";
import User from "../users/user.model.js";
import { sequelize } from "../../config/db.js";
import { QueryTypes } from "sequelize";





/**
 * Get overall system statistics
 * Counts for users, cooperatives, and results
 */
export const getOverviewStats = async (req, res) => {
  try {
    const [usersCount, cooperativesCount, resultsCount] = await Promise.all([
      User.count(),
      Cooperative.count(),
      Result.count(),
    ]);

    
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [recentUsers, recentCooperatives, recentResults] = await Promise.all([
      User.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: thirtyDaysAgo } },
      }),
      Cooperative.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: thirtyDaysAgo } },
      }),
      Result.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: thirtyDaysAgo } },
      }),
    ]);

    res.json({
      overview: {
        total: {
          users: usersCount,
          cooperatives: cooperativesCount,
          results: resultsCount,
        },
        recent30Days: {
          users: recentUsers,
          cooperatives: recentCooperatives,
          results: recentResults,
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching overview statistics",
      error: error.message,
    });
  }
};





/**
 * Get user statistics
 */
export const getUserStats = async (req, res) => {
  try {
    const totalUsers = await User.count();

    
    const usersByRole = await User.findAll({
      attributes: [
        "role",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      group: ["role"],
      raw: true,
    });

    
    const userGrowth = await sequelize.query(
      `SELECT
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM users
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      users: {
        total: totalUsers,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item.role] = parseInt(item.count);
          return acc;
        }, {}),
        growth: userGrowth,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching user statistics",
      error: error.message,
    });
  }
};





/**
 * Get cooperative statistics
 */
export const getCooperativeStats = async (req, res) => {
  try {
    const totalCooperatives = await Cooperative.count();

    
    const scoreDistribution = await sequelize.query(
      `SELECT
        CASE
          WHEN score >= 0 AND score < 20 THEN '0-19'
          WHEN score >= 20 AND score < 40 THEN '20-39'
          WHEN score >= 40 AND score < 60 THEN '40-59'
          WHEN score >= 60 AND score < 80 THEN '60-79'
          WHEN score >= 80 AND score <= 100 THEN '80-100'
        END as scoreRange,
        COUNT(*) as count
      FROM cooperatives
      GROUP BY scoreRange
      ORDER BY scoreRange`,
      { type: QueryTypes.SELECT }
    );

    
    const avgScore = await Cooperative.findOne({
      attributes: [[sequelize.fn("AVG", sequelize.col("score")), "avgScore"]],
      raw: true,
    });

    
    const topCooperatives = await Cooperative.findAll({
      order: [["score", "DESC"]],
      limit: 10,
      attributes: ["id", "name", "score", "founder"],
    });

    
    const cooperativeGrowth = await sequelize.query(
      `SELECT
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM cooperatives
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      cooperatives: {
        total: totalCooperatives,
        averageScore: parseFloat(avgScore.avgScore || 0).toFixed(2),
        scoreDistribution,
        topPerformers: topCooperatives,
        growth: cooperativeGrowth,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching cooperative statistics",
      error: error.message,
    });
  }
};





/**
 * Get comprehensive results statistics
 * This is the main analytics endpoint with detailed assessment data
 */
export const getResultsStats = async (req, res) => {
  try {
    const totalResults = await Result.count();

    
    const resultsGrowth = await sequelize.query(
      `SELECT
        DATE_FORMAT(createdAt, '%Y-%m') as month,
        COUNT(*) as count
      FROM results
      WHERE createdAt >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY DATE_FORMAT(createdAt, '%Y-%m')
      ORDER BY month ASC`,
      { type: QueryTypes.SELECT }
    );

    
    const overallScoreDistribution = await sequelize.query(
      `SELECT
        CASE
          WHEN overallScore >= 1.0 AND overallScore < 1.6 THEN '1.0-1.5 (Très faible)'
          WHEN overallScore >= 1.6 AND overallScore < 2.6 THEN '1.6-2.5 (Faible)'
          WHEN overallScore >= 2.6 AND overallScore < 3.6 THEN '2.6-3.5 (Moyen)'
          WHEN overallScore >= 3.6 AND overallScore < 4.6 THEN '3.6-4.5 (Bon)'
          WHEN overallScore >= 4.6 AND overallScore <= 5.0 THEN '4.6-5.0 (Très bon)'
        END as scoreRange,
        COUNT(*) as count
      FROM results
      WHERE overallScore IS NOT NULL
      GROUP BY scoreRange
      ORDER BY scoreRange`,
      { type: QueryTypes.SELECT }
    );

    
    const avgOverallScore = await Result.findOne({
      attributes: [
        [sequelize.fn("AVG", sequelize.col("overallScore")), "avgScore"],
      ],
      where: { overallScore: { [sequelize.Sequelize.Op.ne]: null } },
      raw: true,
    });

    
    const resultsWithScores = await Result.findAll({
      where: { scoresByCategory: { [sequelize.Sequelize.Op.ne]: null } },
      attributes: ["id", "scoresByCategory", "overallScore", "createdAt"],
      raw: true,
    });

    
    const categoryScores = {};
    const categoryCounts = {};

    resultsWithScores.forEach((result) => {
      const scores =
        typeof result.scoresByCategory === "string"
          ? JSON.parse(result.scoresByCategory)
          : result.scoresByCategory;

      if (scores) {
        Object.entries(scores).forEach(([category, score]) => {
          if (!categoryScores[category]) {
            categoryScores[category] = 0;
            categoryCounts[category] = 0;
          }
          categoryScores[category] += score;
          categoryCounts[category] += 1;
        });
      }
    });

    
    const averageScoresByCategory = {};
    Object.keys(categoryScores).forEach((category) => {
      averageScoresByCategory[category] = parseFloat(
        (categoryScores[category] / categoryCounts[category]).toFixed(2)
      );
    });

    
    const interpretationDistribution = await Result.findAll({
      attributes: [
        "interpretation",
        [sequelize.fn("COUNT", sequelize.col("id")), "count"],
      ],
      where: { interpretation: { [sequelize.Sequelize.Op.ne]: null } },
      group: ["interpretation"],
      raw: true,
    });

    
    const recentResults = await sequelize.query(
      `SELECT
        r.id,
        r.overallScore,
        r.interpretation,
        r.createdAt,
        c.name as cooperativeName,
        c.id as cooperativeId
      FROM results r
      LEFT JOIN cooperatives c ON r.cooperativeId = c.id
      ORDER BY r.createdAt DESC
      LIMIT 10`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      results: {
        total: totalResults,
        averageOverallScore: parseFloat(avgOverallScore.avgScore || 0).toFixed(
          2
        ),
        overallScoreDistribution,
        averageScoresByCategory,
        interpretationDistribution: interpretationDistribution.map((item) => ({
          interpretation: item.interpretation,
          count: parseInt(item.count),
        })),
        growth: resultsGrowth,
        recentAssessments: recentResults,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching results statistics",
      error: error.message,
    });
  }
};

/**
 * Get detailed category performance analytics
 * Shows which categories cooperatives struggle with most
 */
export const getCategoryPerformance = async (req, res) => {
  try {
    
    const resultsWithScores = await Result.findAll({
      where: { scoresByCategory: { [sequelize.Sequelize.Op.ne]: null } },
      attributes: ["id", "scoresByCategory", "cooperativeId"],
      raw: true,
    });

    
    const categoryData = {};

    resultsWithScores.forEach((result) => {
      const scores =
        typeof result.scoresByCategory === "string"
          ? JSON.parse(result.scoresByCategory)
          : result.scoresByCategory;

      if (scores) {
        Object.entries(scores).forEach(([category, score]) => {
          if (!categoryData[category]) {
            categoryData[category] = {
              scores: [],
              total: 0,
              count: 0,
              min: 5,
              max: 0,
            };
          }
          categoryData[category].scores.push(score);
          categoryData[category].total += score;
          categoryData[category].count += 1;
          categoryData[category].min = Math.min(
            categoryData[category].min,
            score
          );
          categoryData[category].max = Math.max(
            categoryData[category].max,
            score
          );
        });
      }
    });

    
    const categoryPerformance = Object.entries(categoryData).map(
      ([category, data]) => {
        const average = data.total / data.count;

        
        const variance =
          data.scores.reduce((sum, score) => {
            return sum + Math.pow(score - average, 2);
          }, 0) / data.count;
        const stdDev = Math.sqrt(variance);

        
        let performanceLevel = "Moyen";
        if (average >= 4.6) performanceLevel = "Très bon";
        else if (average >= 3.6) performanceLevel = "Bon";
        else if (average >= 2.6) performanceLevel = "Moyen";
        else if (average >= 1.6) performanceLevel = "Faible";
        else performanceLevel = "Très faible";

        return {
          category,
          average: parseFloat(average.toFixed(2)),
          min: data.min,
          max: data.max,
          standardDeviation: parseFloat(stdDev.toFixed(2)),
          assessmentCount: data.count,
          performanceLevel,
        };
      }
    );

    
    categoryPerformance.sort((a, b) => a.average - b.average);

    res.json({
      categoryPerformance,
      summary: {
        totalCategories: categoryPerformance.length,
        weakestCategory: categoryPerformance[0],
        strongestCategory: categoryPerformance[categoryPerformance.length - 1],
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching category performance",
      error: error.message,
    });
  }
};

/**
 * Get recommendations analytics
 * Shows most common recommendations across all assessments
 */
export const getRecommendationsAnalytics = async (req, res) => {
  try {
    const resultsWithRecommendations = await Result.findAll({
      where: { recommendations: { [sequelize.Sequelize.Op.ne]: null } },
      attributes: ["id", "recommendations", "overallScore"],
      raw: true,
    });

    
    const recommendationCounts = {};
    let totalRecommendations = 0;

    resultsWithRecommendations.forEach((result) => {
      const recs =
        typeof result.recommendations === "string"
          ? JSON.parse(result.recommendations)
          : result.recommendations;

      if (Array.isArray(recs)) {
        recs.forEach((rec) => {
          
          const category = rec.split(":")[0]?.trim();
          if (category) {
            recommendationCounts[category] =
              (recommendationCounts[category] || 0) + 1;
            totalRecommendations++;
          }
        });
      }
    });

    
    const topRecommendations = Object.entries(recommendationCounts)
      .map(([category, count]) => ({
        category,
        count,
        percentage: parseFloat(
          ((count / totalRecommendations) * 100).toFixed(2)
        ),
      }))
      .sort((a, b) => b.count - a.count);

    res.json({
      recommendations: {
        total: totalRecommendations,
        uniqueCategories: topRecommendations.length,
        topRecommendations: topRecommendations.slice(0, 10),
        allRecommendations: topRecommendations,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching recommendations analytics",
      error: error.message,
    });
  }
};

/**
 * Get comprehensive dashboard analytics
 * Combines all analytics in one endpoint for dashboard display
 */
export const getDashboardAnalytics = async (req, res) => {
  try {
    
    const [usersCount, cooperativesCount, resultsCount] = await Promise.all([
      User.count(),
      Cooperative.count(),
      Result.count(),
    ]);

    
    const [avgCoopScore, avgResultScore] = await Promise.all([
      Cooperative.findOne({
        attributes: [[sequelize.fn("AVG", sequelize.col("score")), "avgScore"]],
        raw: true,
      }),
      Result.findOne({
        attributes: [
          [sequelize.fn("AVG", sequelize.col("overallScore")), "avgScore"],
        ],
        where: { overallScore: { [sequelize.Sequelize.Op.ne]: null } },
        raw: true,
      }),
    ]);

    
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const recentActivity = await Promise.all([
      Result.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: sevenDaysAgo } },
      }),
      Cooperative.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: sevenDaysAgo } },
      }),
      User.count({
        where: { createdAt: { [sequelize.Sequelize.Op.gte]: sevenDaysAgo } },
      }),
    ]);

    
    const topCooperatives = await Cooperative.findAll({
      order: [["score", "DESC"]],
      limit: 5,
      attributes: ["id", "name", "score"],
    });

    
    const recentAssessments = await sequelize.query(
      `SELECT
        r.id,
        r.overallScore,
        r.interpretation,
        r.createdAt,
        c.name as cooperativeName
      FROM results r
      LEFT JOIN cooperatives c ON r.cooperativeId = c.id
      ORDER BY r.createdAt DESC
      LIMIT 5`,
      { type: QueryTypes.SELECT }
    );

    
    const scoreDistribution = await sequelize.query(
      `SELECT
        CASE
          WHEN overallScore >= 1.0 AND overallScore < 1.6 THEN 'Très faible'
          WHEN overallScore >= 1.6 AND overallScore < 2.6 THEN 'Faible'
          WHEN overallScore >= 2.6 AND overallScore < 3.6 THEN 'Moyen'
          WHEN overallScore >= 3.6 AND overallScore < 4.6 THEN 'Bon'
          WHEN overallScore >= 4.6 AND overallScore <= 5.0 THEN 'Très bon'
        END as level,
        COUNT(*) as count
      FROM results
      WHERE overallScore IS NOT NULL
      GROUP BY level
      ORDER BY
        CASE level
          WHEN 'Très faible' THEN 1
          WHEN 'Faible' THEN 2
          WHEN 'Moyen' THEN 3
          WHEN 'Bon' THEN 4
          WHEN 'Très bon' THEN 5
        END`,
      { type: QueryTypes.SELECT }
    );

    res.json({
      dashboard: {
        overview: {
          totalUsers: usersCount,
          totalCooperatives: cooperativesCount,
          totalResults: resultsCount,
          averageCooperativeScore: parseFloat(
            avgCoopScore.avgScore || 0
          ).toFixed(2),
          averageResultScore: parseFloat(avgResultScore.avgScore || 0).toFixed(
            2
          ),
        },
        recentActivity: {
          last7Days: {
            newAssessments: recentActivity[0],
            newCooperatives: recentActivity[1],
            newUsers: recentActivity[2],
          },
        },
        topPerformers: topCooperatives,
        recentAssessments,
        scoreDistribution,
      },
    });
  } catch (error) {
    res.status(500).json({
      message: "Error fetching dashboard analytics",
      error: error.message,
    });
  }
};
