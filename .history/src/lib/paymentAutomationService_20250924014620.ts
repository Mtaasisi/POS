import { supabase } from './supabaseClient';
import { paymentTrackingService } from './paymentTrackingService';
import { paymentSecurityService } from './paymentSecurityService';

export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  type: 'payment_processing' | 'fraud_detection' | 'reconciliation' | 'notification' | 'compliance';
  status: 'active' | 'inactive' | 'draft';
  conditions: {
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
    value: any;
    logicalOperator?: 'AND' | 'OR';
  }[];
  actions: {
    type: 'update_status' | 'send_notification' | 'create_alert' | 'trigger_workflow' | 'block_transaction';
    parameters: Record<string, any>;
  }[];
  priority: number;
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface Workflow {
  id: string;
  name: string;
  description: string;
  status: 'active' | 'inactive' | 'draft';
  steps: {
    id: string;
    name: string;
    type: 'condition' | 'action' | 'delay' | 'webhook';
    parameters: Record<string, any>;
    nextStepId?: string;
    errorStepId?: string;
  }[];
  triggerEvents: string[];
  executionCount: number;
  lastExecuted?: string;
  createdAt: string;
  updatedAt: string;
  createdBy: string;
  updatedBy?: string;
}

export interface AutomationMetrics {
  totalRules: number;
  activeRules: number;
  totalWorkflows: number;
  activeWorkflows: number;
  executionsToday: number;
  successRate: number;
  averageExecutionTime: number;
}

class PaymentAutomationService {
  private cache: Map<string, { data: any; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 300000; // 5 minutes cache

  // Clear cache
  private clearCache() {
    this.cache.clear();
  }

  // Get cached data or null if expired
  private getCachedData(key: string): any | null {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.CACHE_DURATION) {
      return cached.data;
    }
    return null;
  }

  // Set cached data
  private setCachedData(key: string, data: any) {
    this.cache.set(key, { data, timestamp: Date.now() });
  }

  // Get all automation rules
  async getAutomationRules(): Promise<AutomationRule[]> {
    try {
      const cacheKey = 'automation_rules';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const { data, error } = await supabase
        .from('automation_rules')
        .select('*')
        .order('priority', { ascending: false });

      if (error) throw error;

      const rules = data?.map((rule: any) => ({
        id: rule.id,
        name: rule.name,
        description: rule.description,
        type: rule.type,
        status: rule.status,
        conditions: rule.conditions,
        actions: rule.actions,
        priority: rule.priority,
        executionCount: rule.execution_count,
        lastExecuted: rule.last_executed,
        createdAt: rule.created_at,
        updatedAt: rule.updated_at,
        createdBy: rule.created_by,
        updatedBy: rule.updated_by
      })) || [];

      this.setCachedData(cacheKey, rules);
      return rules;
    } catch (error) {
      console.error('Error fetching automation rules:', error);
      return [];
    }
  }

  // Get active automation rules
  async getActiveAutomationRules(): Promise<AutomationRule[]> {
    try {
      const rules = await this.getAutomationRules();
      return rules.filter(rule => rule.status === 'active');
    } catch (error) {
      console.error('Error fetching active automation rules:', error);
      return [];
    }
  }

  // Create automation rule
  async createAutomationRule(
    rule: Omit<AutomationRule, 'id' | 'executionCount' | 'lastExecuted' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    userId: string
  ): Promise<AutomationRule | null> {
    try {
      const { data, error } = await supabase
        .from('automation_rules')
        .insert({
          name: rule.name,
          description: rule.description,
          type: rule.type,
          status: rule.status,
          conditions: rule.conditions,
          actions: rule.actions,
          priority: rule.priority,
          execution_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        type: data.type,
        status: data.status,
        conditions: data.conditions,
        actions: data.actions,
        priority: data.priority,
        executionCount: data.execution_count,
        lastExecuted: data.last_executed,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by
      };
    } catch (error) {
      console.error('Error creating automation rule:', error);
      return null;
    }
  }

  // Update automation rule
  async updateAutomationRule(
    id: string,
    updates: Partial<AutomationRule>,
    userId: string
  ): Promise<boolean> {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString(),
        updated_by: userId
      };

      if (updates.name) updateData.name = updates.name;
      if (updates.description) updateData.description = updates.description;
      if (updates.type) updateData.type = updates.type;
      if (updates.status) updateData.status = updates.status;
      if (updates.conditions) updateData.conditions = updates.conditions;
      if (updates.actions) updateData.actions = updates.actions;
      if (updates.priority !== undefined) updateData.priority = updates.priority;

      const { error } = await supabase
        .from('automation_rules')
        .update(updateData)
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error updating automation rule:', error);
      return false;
    }
  }

  // Execute automation rules for a payment
  async executeAutomationRules(payment: any): Promise<{
    executedRules: string[];
    actions: Array<{ type: string; parameters: any; success: boolean }>;
  }> {
    try {
      console.log(`🤖 Executing automation rules for payment ${payment.id}...`);
      
      const activeRules = await this.getActiveAutomationRules();
      const executedRules: string[] = [];
      const actions: Array<{ type: string; parameters: any; success: boolean }> = [];

      for (const rule of activeRules) {
        if (this.evaluateRuleConditions(rule, payment)) {
          console.log(`✅ Rule "${rule.name}" conditions met, executing actions...`);
          
          executedRules.push(rule.id);
          
          for (const action of rule.actions) {
            const success = await this.executeAction(action, payment);
            actions.push({
              type: action.type,
              parameters: action.parameters,
              success
            });
          }

          // Update rule execution count
          await this.updateRuleExecutionCount(rule.id);
        }
      }

      return { executedRules, actions };
    } catch (error) {
      console.error('Error executing automation rules:', error);
      return { executedRules: [], actions: [] };
    }
  }

  // Evaluate rule conditions
  private evaluateRuleConditions(rule: AutomationRule, payment: any): boolean {
    try {
      let result = true;
      let logicalOperator: 'AND' | 'OR' = 'AND';

      for (let i = 0; i < rule.conditions.length; i++) {
        const condition = rule.conditions[i];
        const conditionResult = this.evaluateCondition(condition, payment);

        if (i === 0) {
          result = conditionResult;
        } else {
          if (logicalOperator === 'AND') {
            result = result && conditionResult;
          } else {
            result = result || conditionResult;
          }
        }

        logicalOperator = condition.logicalOperator || 'AND';
      }

      return result;
    } catch (error) {
      console.error('Error evaluating rule conditions:', error);
      return false;
    }
  }

  // Evaluate individual condition
  private evaluateCondition(condition: any, payment: any): boolean {
    try {
      const fieldValue = this.getNestedValue(payment, condition.field);
      const conditionValue = condition.value;

      switch (condition.operator) {
        case 'equals':
          return fieldValue === conditionValue;
        case 'not_equals':
          return fieldValue !== conditionValue;
        case 'greater_than':
          return Number(fieldValue) > Number(conditionValue);
        case 'less_than':
          return Number(fieldValue) < Number(conditionValue);
        case 'contains':
          return String(fieldValue).toLowerCase().includes(String(conditionValue).toLowerCase());
        case 'in':
          return Array.isArray(conditionValue) && conditionValue.includes(fieldValue);
        case 'not_in':
          return Array.isArray(conditionValue) && !conditionValue.includes(fieldValue);
        default:
          return false;
      }
    } catch (error) {
      console.error('Error evaluating condition:', error);
      return false;
    }
  }

  // Get nested value from object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => current?.[key], obj);
  }

  // Execute action
  private async executeAction(action: any, payment: any): Promise<boolean> {
    try {
      switch (action.type) {
        case 'update_status':
          return await this.updatePaymentStatus(payment.id, action.parameters.status, payment.source);
        
        case 'send_notification':
          return await this.sendNotification(action.parameters, payment);
        
        case 'create_alert':
          return await this.createSecurityAlert(action.parameters, payment);
        
        case 'trigger_workflow':
          return await this.triggerWorkflow(action.parameters.workflowId, payment);
        
        case 'block_transaction':
          return await this.blockTransaction(payment.id, action.parameters.reason);
        
        default:
          console.warn(`Unknown action type: ${action.type}`);
          return false;
      }
    } catch (error) {
      console.error('Error executing action:', error);
      return false;
    }
  }

  // Update payment status
  private async updatePaymentStatus(paymentId: string, status: string, source: string): Promise<boolean> {
    try {
      return await paymentTrackingService.updatePaymentStatus(
        paymentId,
        status as 'completed' | 'pending' | 'failed' | 'stopped' | 'cancelled',
        source as 'device_payment' | 'pos_sale' | 'purchase_order'
      );
    } catch (error) {
      console.error('Error updating payment status:', error);
      return false;
    }
  }

  // Send notification
  private async sendNotification(parameters: any, payment: any): Promise<boolean> {
    try {
      // This would integrate with your notification service
      console.log(`📧 Sending notification: ${parameters.message} for payment ${payment.id}`);
      return true;
    } catch (error) {
      console.error('Error sending notification:', error);
      return false;
    }
  }

  // Create security alert
  private async createSecurityAlert(parameters: any, payment: any): Promise<boolean> {
    try {
      // This would integrate with the security service
      console.log(`🚨 Creating security alert: ${parameters.title} for payment ${payment.id}`);
      return true;
    } catch (error) {
      console.error('Error creating security alert:', error);
      return false;
    }
  }

  // Trigger workflow
  private async triggerWorkflow(workflowId: string, payment: any): Promise<boolean> {
    try {
      console.log(`🔄 Triggering workflow ${workflowId} for payment ${payment.id}`);
      // This would execute the workflow
      return true;
    } catch (error) {
      console.error('Error triggering workflow:', error);
      return false;
    }
  }

  // Block transaction
  private async blockTransaction(paymentId: string, reason: string): Promise<boolean> {
    try {
      console.log(`🚫 Blocking transaction ${paymentId}: ${reason}`);
      // This would mark the transaction as blocked
      return true;
    } catch (error) {
      console.error('Error blocking transaction:', error);
      return false;
    }
  }

  // Update rule execution count
  private async updateRuleExecutionCount(ruleId: string): Promise<void> {
    try {
      await supabase
        .from('automation_rules')
        .update({
          execution_count: supabase.raw('execution_count + 1'),
          last_executed: new Date().toISOString()
        })
        .eq('id', ruleId);
    } catch (error) {
      console.error('Error updating rule execution count:', error);
    }
  }

  // Get automation metrics
  async getAutomationMetrics(): Promise<AutomationMetrics> {
    try {
      const cacheKey = 'automation_metrics';
      
      // Check cache first
      const cachedData = this.getCachedData(cacheKey);
      if (cachedData) {
        return cachedData;
      }

      const rules = await this.getAutomationRules();
      const workflows = await this.getWorkflows();

      const totalRules = rules.length;
      const activeRules = rules.filter(r => r.status === 'active').length;
      const totalWorkflows = workflows.length;
      const activeWorkflows = workflows.filter(w => w.status === 'active').length;
      const executionsToday = rules.reduce((sum, r) => sum + r.executionCount, 0);
      const successRate = 95; // This would be calculated from actual execution logs
      const averageExecutionTime = 150; // This would be calculated from actual execution logs

      const metrics: AutomationMetrics = {
        totalRules,
        activeRules,
        totalWorkflows,
        activeWorkflows,
        executionsToday,
        successRate,
        averageExecutionTime
      };

      this.setCachedData(cacheKey, metrics);
      return metrics;
    } catch (error) {
      console.error('Error fetching automation metrics:', error);
      return {
        totalRules: 0,
        activeRules: 0,
        totalWorkflows: 0,
        activeWorkflows: 0,
        executionsToday: 0,
        successRate: 0,
        averageExecutionTime: 0
      };
    }
  }

  // Get workflows
  async getWorkflows(): Promise<Workflow[]> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data?.map((workflow: any) => ({
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        status: workflow.status,
        steps: workflow.steps,
        triggerEvents: workflow.trigger_events,
        executionCount: workflow.execution_count,
        lastExecuted: workflow.last_executed,
        createdAt: workflow.created_at,
        updatedAt: workflow.updated_at,
        createdBy: workflow.created_by,
        updatedBy: workflow.updated_by
      })) || [];
    } catch (error) {
      console.error('Error fetching workflows:', error);
      return [];
    }
  }

  // Create workflow
  async createWorkflow(
    workflow: Omit<Workflow, 'id' | 'executionCount' | 'lastExecuted' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>,
    userId: string
  ): Promise<Workflow | null> {
    try {
      const { data, error } = await supabase
        .from('automation_workflows')
        .insert({
          name: workflow.name,
          description: workflow.description,
          status: workflow.status,
          steps: workflow.steps,
          trigger_events: workflow.triggerEvents,
          execution_count: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: userId
        })
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return {
        id: data.id,
        name: data.name,
        description: data.description,
        status: data.status,
        steps: data.steps,
        triggerEvents: data.trigger_events,
        executionCount: data.execution_count,
        lastExecuted: data.last_executed,
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        createdBy: data.created_by,
        updatedBy: data.updated_by
      };
    } catch (error) {
      console.error('Error creating workflow:', error);
      return null;
    }
  }

  // Delete automation rule
  async deleteAutomationRule(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('automation_rules')
        .delete()
        .eq('id', id);

      if (error) throw error;

      // Clear cache
      this.clearCache();
      return true;
    } catch (error) {
      console.error('Error deleting automation rule:', error);
      return false;
    }
  }

  // Clear cache (public method)
  public clearAutomationCache() {
    this.clearCache();
  }
}

export const paymentAutomationService = new PaymentAutomationService();
